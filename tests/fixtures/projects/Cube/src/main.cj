package cube

main() {
    let cube = Cube()
    cube.print()
    // 1.基本操作
    for (r in [F, B, L, R, U, D]) {
        cube.apply(r, record: true)
    }
    cube.reset()
    cube.apply(F * R * I(F * R)) // 复合操作

    // 2.置换的阶数
    // FFRR 是 2,3 阶置换的组合，其最小公倍数是 6，重复 6 次两类置换都会还原
    cube.apply((F * F * R * R) ** 6)
    // FULLR 是 3,4,6,9,18 阶置换的组合，同理可得其阶数为 36
    cube.apply((F * U * L * L * R) ** 36)
    cube.apply((F * F * L * L * B * R) ** 90)

    // 3.相似变换 UGU⁻¹
    // 已知 R⁻¹DRFDF⁻¹ 可以翻转 FUR 角块
    let G = I(R) * D * R * F * D * I(F)
    cube.apply(G)
    // 为了翻转 BUR 角块，可以先执行 U 把 BUR 换到 FUR 位置，然后执行 G 翻转 FUR，最后执行 U⁻¹ 恢复 BUR 位置
    let H = U * G * I(U)
    cube.apply(H)

    // 4.组合子变换 MU⁻¹M⁻¹U
    // 已知 RL⁻¹FFLR⁻¹D⁻¹RL⁻¹FLR⁻¹ 可以保持顶面其他方块不变、仅翻转 UF 棱块，但下面两层会被打乱
    let M = R * I(L) * F * F * L * I(R) * I(D) * R * I(L) * F * L * I(R)
    cube.apply(M)
    // 为了同时翻转 UF 和 UL，可以先执行 M 翻转 UF，然后执行 U⁻¹ 把 UL 换到 UF 位置
    // 再执行 M⁻¹ 翻转 UL 并还原下面两层，最后执行 U 恢复 UF 和 UL 位置，这样整个魔方仅有 UF 和 UL 被翻转
    let N = M * I(U) * I(M) * U
    cube.apply(N)
    // 在此基础上，如果想同时翻转 UL 和 UR，可以按组合子思想执行 NUN⁻¹U⁻¹
    let P = N * U * I(N) * I(U)
    cube.apply(P)
}