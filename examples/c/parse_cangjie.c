/**
 * 使用 tree-sitter-cangjie 解析仓颉源代码并展示语法树。
 *
 * 本程序演示如何在 C 中使用 tree-sitter 和 tree-sitter-cangjie 解析仓颉源文件，
 * 输出语法树的 S-expression 并递归遍历打印完整的语法结构，
 * 并使用 tree-sitter Query API 提取顶层定义（函数、类、接口、枚举）。
 *
 * 使用方式详见 readme.md。
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <tree-sitter-0.25/api.h>
#include "tree-sitter-cangjie.h"

/**
 * 递归打印语法树节点，显示类型、位置和（叶子节点的）文本。
 */
static void print_tree(TSNode node, const char *source, int indent) {
    const char *type = ts_node_type(node);
    TSPoint start = ts_node_start_point(node);
    TSPoint end = ts_node_end_point(node);
    uint32_t child_count = ts_node_child_count(node);

    for (int i = 0; i < indent; i++) printf("  ");

    if (child_count == 0) {
        uint32_t start_byte = ts_node_start_byte(node);
        uint32_t end_byte = ts_node_end_byte(node);
        uint32_t len = end_byte - start_byte;
        printf("%s [%u:%u-%u:%u] \"%.*s\"\n", type, start.row, start.column,
               end.row, end.column, len, source + start_byte);
    } else {
        printf("%s [%u:%u-%u:%u]\n", type, start.row, start.column, end.row,
               end.column);
        for (uint32_t i = 0; i < child_count; i++) {
            print_tree(ts_node_child(node, i), source, indent + 1);
        }
    }
}

/**
 * 递归统计节点总数。
 */
static int count_nodes(TSNode node) {
    int count = 1;
    uint32_t child_count = ts_node_child_count(node);
    for (uint32_t i = 0; i < child_count; i++) {
        count += count_nodes(ts_node_child(node, i));
    }
    return count;
}

/**
 * 使用 Query API 提取顶层定义（函数、类、接口、枚举）。
 */
static void query_definitions(TSNode root, const char *source,
                              const TSLanguage *lang) {
    static const char *query_src =
        "(functionDefinition  (funcName)      @func)"
        "(classDefinition     (className)     @class)"
        "(interfaceDefinition (interfaceName) @interface)"
        "(enumDefinition      (enumName)      @enum)";

    uint32_t error_offset = 0;
    TSQueryError error_type = TSQueryErrorNone;
    TSQuery *query = ts_query_new(lang, query_src, (uint32_t)strlen(query_src),
                                  &error_offset, &error_type);
    if (!query) {
        fprintf(stderr, "  Query error at offset %u (type %d)\n",
                error_offset, error_type);
        return;
    }

    TSQueryCursor *cursor = ts_query_cursor_new();
    ts_query_cursor_exec(cursor, query, root);

    TSQueryMatch match;
    while (ts_query_cursor_next_match(cursor, &match)) {
        for (uint16_t i = 0; i < match.capture_count; i++) {
            TSNode cap_node = match.captures[i].node;
            uint32_t cap_idx = match.captures[i].index;

            uint32_t name_len = 0;
            const char *cap_name =
                ts_query_capture_name_for_id(query, cap_idx, &name_len);

            TSPoint pos = ts_node_start_point(cap_node);
            uint32_t start_byte = ts_node_start_byte(cap_node);
            uint32_t end_byte = ts_node_end_byte(cap_node);
            uint32_t text_len = end_byte - start_byte;

            printf("  [line %2u] @%.*s: %.*s\n",
                   pos.row + 1,
                   name_len, cap_name,
                   text_len, source + start_byte);
        }
    }

    ts_query_cursor_delete(cursor);
    ts_query_delete(query);
}

/**
 * 递归收集并打印错误节点。
 */
static int collect_errors(TSNode node) {
    int found = 0;
    if (ts_node_is_error(node) || ts_node_is_missing(node)) {
        TSPoint pos = ts_node_start_point(node);
        printf("  %s at %u:%u\n",
               ts_node_is_missing(node) ? "MISSING" : "ERROR",
               pos.row + 1, pos.column + 1);
        found = 1;
    }
    uint32_t child_count = ts_node_child_count(node);
    for (uint32_t i = 0; i < child_count; i++) {
        found |= collect_errors(ts_node_child(node, i));
    }
    return found;
}

/**
 * 读取文件内容，返回动态分配的字符串（需调用者 free）。
 */
static char *read_file(const char *path, size_t *out_len) {
    FILE *f = fopen(path, "rb");
    if (!f) return NULL;

    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *buf = (char *)malloc(len + 1);
    if (!buf) {
        fclose(f);
        return NULL;
    }
    size_t n = fread(buf, 1, len, f);
    buf[n] = '\0';
    fclose(f);

    if (out_len) *out_len = n;
    return buf;
}

int main(void) {
    const char *sample_path = "../sample.cj";

    size_t source_len = 0;
    char *source = read_file(sample_path, &source_len);
    if (!source) {
        fprintf(stderr, "Error: cannot read file: %s\n", sample_path);
        return 1;
    }

    /* 初始化解析器 */
    TSParser *parser = ts_parser_new();
    const TSLanguage *lang = tree_sitter_cangjie();
    ts_parser_set_language(parser, lang);

    /* 解析源代码 */
    TSTree *tree = ts_parser_parse_string(parser, NULL, source, (uint32_t)source_len);
    TSNode root = ts_tree_root_node(tree);

    /* 1. 输出 S-expression */
    printf("=== S-expression ===\n");
    char *sexp = ts_node_string(root);
    printf("%s\n", sexp);
    free(sexp);

    /* 2. 输出结构化语法树 */
    printf("\n=== Syntax Tree ===\n");
    print_tree(root, source, 0);

    /* 3. 统计信息 */
    int total = count_nodes(root);
    printf("\nTotal nodes: %d\n", total);
    printf("Root node type: %s\n", ts_node_type(root));
    printf("Has errors: %s\n", ts_node_has_error(root) ? "true" : "false");

    /* 4. Query：提取顶层定义 */
    printf("\n=== Definitions (via Query) ===\n");
    query_definitions(root, source, lang);

    /* 5. 错误节点检测 */
    printf("\n=== Parse Errors ===\n");
    if (!collect_errors(root)) {
        printf("  No parse errors.\n");
    }

    /* 6. 增量解析演示：追加一个新函数后重新解析 */
    printf("\n=== Incremental Parsing Demo ===\n");
    const char *appended_code =
        "\n// 新增函数\nfunc square(x: Int64): Int64 {\n    return x * x\n}\n";
    size_t appended_len = strlen(appended_code);
    char *new_source = (char *)malloc(source_len + appended_len + 1);
    if (new_source) {
        memcpy(new_source, source, source_len);
        memcpy(new_source + source_len, appended_code, appended_len);
        new_source[source_len + appended_len] = '\0';

        /* 计算追加位置的行号 */
        uint32_t start_row = 0;
        for (size_t i = 0; i < source_len; i++) {
            if (source[i] == '\n') start_row++;
        }

        TSInputEdit edit = {
            .start_byte    = (uint32_t)source_len,
            .old_end_byte  = (uint32_t)source_len,
            .new_end_byte  = (uint32_t)(source_len + appended_len),
            .start_point   = {start_row, 0},
            .old_end_point = {start_row, 0},
            .new_end_point = {start_row + 5, 0},
        };
        ts_tree_edit(tree, &edit);

        TSTree *new_tree = ts_parser_parse_string(
            parser, tree, new_source, (uint32_t)(source_len + appended_len));
        TSNode new_root = ts_tree_root_node(new_tree);

        printf("  After appending a new function:\n");
        query_definitions(new_root, new_source, lang);

        ts_tree_delete(new_tree);
        free(new_source);
    }

    /* 清理 */
    ts_tree_delete(tree);
    ts_parser_delete(parser);
    free(source);

    return 0;
}
