#ifndef TREE_SITTER_WASM_STDLIB_H_
#define TREE_SITTER_WASM_STDLIB_H_

#include <stddef.h>

void *calloc(size_t count, size_t size);
void free(void *pointer);

#endif
