cmake_minimum_required(VERSION 3.13)

project(tree-sitter-cangjie
        VERSION "1.0.5"
        DESCRIPTION "Cangjie parser for tree-sitter"
        HOMEPAGE_URL "https://gitcode.com/Cangjie-SIG/tree-sitter-cangjie"
        LANGUAGES C)

option(BUILD_SHARED_LIBS "Build using shared libraries" ON)
option(TREE_SITTER_REUSE_ALLOCATOR "Reuse the library allocator" OFF)

set(TREE_SITTER_ABI_VERSION 15 CACHE STRING "Tree-sitter ABI version")
if(NOT ${TREE_SITTER_ABI_VERSION} MATCHES "^[0-9]+$")
    unset(TREE_SITTER_ABI_VERSION CACHE)
    message(FATAL_ERROR "TREE_SITTER_ABI_VERSION must be an integer")
endif()

set(ROOT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../..")

find_program(TREE_SITTER_CLI tree-sitter DOC "Tree-sitter CLI")

add_custom_command(OUTPUT "${ROOT_DIR}/src/parser.c"
                   DEPENDS "${ROOT_DIR}/src/grammar.json"
                   COMMAND "${TREE_SITTER_CLI}" generate src/grammar.json
                            --abi=${TREE_SITTER_ABI_VERSION}
                   WORKING_DIRECTORY "${ROOT_DIR}"
                   COMMENT "Generating parser.c")

add_library(tree-sitter-cangjie "${ROOT_DIR}/src/parser.c")
if(EXISTS "${ROOT_DIR}/src/scanner.c")
  target_sources(tree-sitter-cangjie PRIVATE "${ROOT_DIR}/src/scanner.c")
endif()
target_include_directories(tree-sitter-cangjie
                           PRIVATE "${ROOT_DIR}/src"
                           INTERFACE $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
                                     $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>)

target_compile_definitions(tree-sitter-cangjie PRIVATE
                           $<$<BOOL:${TREE_SITTER_REUSE_ALLOCATOR}>:TREE_SITTER_REUSE_ALLOCATOR>
                           $<$<CONFIG:Debug>:TREE_SITTER_DEBUG>)

set_target_properties(tree-sitter-cangjie
                      PROPERTIES
                      C_STANDARD 11
                      POSITION_INDEPENDENT_CODE ON
                      SOVERSION "${TREE_SITTER_ABI_VERSION}.${PROJECT_VERSION_MAJOR}"
                      DEFINE_SYMBOL "")

configure_file(tree-sitter-cangjie.pc.in
               "${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-cangjie.pc" @ONLY)

include(GNUInstallDirs)

install(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/tree_sitter"
        DESTINATION "${CMAKE_INSTALL_INCLUDEDIR}"
        FILES_MATCHING PATTERN "*.h")
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-cangjie.pc"
        DESTINATION "${CMAKE_INSTALL_DATAROOTDIR}/pkgconfig")
install(TARGETS tree-sitter-cangjie
        LIBRARY DESTINATION "${CMAKE_INSTALL_LIBDIR}")

file(GLOB QUERIES "${ROOT_DIR}/queries/*.scm")
install(FILES ${QUERIES}
        DESTINATION "${CMAKE_INSTALL_DATADIR}/tree-sitter/queries/cangjie")

add_custom_target(ts-test "${TREE_SITTER_CLI}" test
                  WORKING_DIRECTORY "${ROOT_DIR}"
                  COMMENT "tree-sitter test")
