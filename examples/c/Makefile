REPO_ROOT := ../..
RELEASE_DIR := $(REPO_ROOT)/release

CC := gcc
# -I$(RELEASE_DIR) 提供 tree-sitter-cangjie.h 和 tree-sitter-0.25/api.h（随 release 预置）
CFLAGS := -Wall -Wextra -std=c11 -I$(RELEASE_DIR)

TARGET := parse_cangjie

.PHONY: all clean run

all: $(TARGET)

# 静态链接 tree-sitter-cangjie 语法库 + tree-sitter 0.25 运行时（均预置于 release/）
# 无需安装任何系统依赖
$(TARGET): parse_cangjie.c
	$(CC) $(CFLAGS) -o $@ $< \
		$(RELEASE_DIR)/libtree-sitter-cangjie.a \
		$(RELEASE_DIR)/libtree-sitter-0.25.a

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)
