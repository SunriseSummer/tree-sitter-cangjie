#!/usr/bin/env python3
"""Compile shared syntax fixtures with the pinned official SDK; run executables.

Usage: python scripts/verify-compiler.py --sdk /path/to/cangjie --stdx /path/to/stdx
The stdx directory may be the extracted archive root; its layout is discovered.
All outputs go to temporary directories. No downloaded files enter the repo.
"""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--sdk', type=Path, required=True)
    ap.add_argument('--stdx', type=Path, required=True)
    ap.add_argument('--report', type=Path)
    args = ap.parse_args()
    sdk = args.sdk.resolve()
    stdx = args.stdx.resolve()
    metadata = json.loads((ROOT / 'language-version.json').read_text(encoding="utf-8"))
    compiler = sdk / 'bin/cjc'
    version = subprocess.check_output([str(compiler), '--version'], text=True)
    if f"{metadata['sdkVersion']} (" not in version:
        raise SystemExit(f"Wrong SDK, expected {metadata['sdkVersion']}: {version}")
    stdx_modules = {p.parent for p in stdx.rglob('stdx.effect.cjo')}
    if not stdx_modules:
        raise SystemExit('Cannot find stdx.effect.cjo in --stdx directory')
    module = sorted(stdx_modules)[0]
    libraries = sorted({p.parent for p in stdx.rglob('libstdx*.so')})
    env = os.environ.copy()
    env['CANGJIE_HOME'] = str(sdk)
    env['LD_LIBRARY_PATH'] = os.pathsep.join(map(str, [
        sdk / 'runtime/lib/linux_x86_64_cjnative',
        sdk / 'lib/linux_x86_64_cjnative', *libraries,
    ])) + os.pathsep + env.get('LD_LIBRARY_PATH', '')
    cases = [c for f in metadata['fixtures'] for c in
             json.loads((ROOT / 'tests/fixtures/versions' / f).read_text(encoding="utf-8")) if c.get('compile')]

    def check(case):
        with tempfile.TemporaryDirectory(prefix='cangjie-fixture-') as directory:
            work = Path(directory)
            source = work / 'fixture.cj'
            source.write_text(case['source'], encoding='utf-8')
            flags = case.get('compilerFlags', [])
            has_main = bool(re.search(r'\bmain\s*\(', case['source']))
            cmd = [str(compiler), str(source), *flags, '--import-path', str(module)]
            for lib in libraries:
                cmd.extend(['-L', str(lib)])
            if 'stdx.effect' in case['source']:
                cmd.append('-lstdx.effect')
            if '--compile-macro' not in flags:
                if not has_main:
                    cmd.append('--output-type=staticlib')
                cmd.extend(['-o', str(work / 'fixture')])
            result = subprocess.run(cmd, cwd=work, env=env, text=True,
                                    capture_output=True, timeout=60)
            record = {'name': case['name'], 'compiled': result.returncode == 0}
            if result.returncode:
                record['diagnostic'] = result.stderr[-6000:]
            elif has_main:
                run = subprocess.run([str(work / 'fixture')], cwd=work, env=env,
                                     text=True, capture_output=True, timeout=15)
                record.update(executed=run.returncode == 0, stdout=run.stdout)
                if run.returncode:
                    record['diagnostic'] = run.stderr
                if 'stdout' in case:
                    record['outputMatched'] = run.stdout == case['stdout']
            print(f"{'PASS' if all(v is not False for v in record.values()) else 'FAIL'}: {case['name']}", flush=True)
            return record

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(check, cases))
    report = {'sdkVersion': metadata['sdkVersion'], 'compiler': version.strip(),
              'cases': records}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    failures = [r for r in records if any(v is False for v in r.values())]
    for record in failures:
        print(json.dumps(record, ensure_ascii=False, indent=2))
    print(f"{len(records) - len(failures)}/{len(records)} compiler fixtures passed")
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
