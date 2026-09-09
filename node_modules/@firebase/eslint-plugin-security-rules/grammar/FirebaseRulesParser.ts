// @ts-nocheck
/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Generated from grammar/FirebaseRulesParser.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4_lib from 'antlr4';
const antlr4 = antlr4_lib.atn ? antlr4_lib : antlr4_lib.default;

import FirebaseRulesParserListener from './FirebaseRulesParserListener.js';



const serializedATN = [
  4,   1,   78,  545, 2,   0,   7,   0,   2,   1,   7,   1,   2,   2,   7,
  2,   2,   3,   7,   3,   2,   4,   7,   4,   2,   5,   7,   5,   2,   6,
  7,   6,   2,   7,   7,   7,   2,   8,   7,   8,   2,   9,   7,   9,   2,
  10,  7,   10,  2,   11,  7,   11,  2,   12,  7,   12,  2,   13,  7,   13,
  2,   14,  7,   14,  2,   15,  7,   15,  2,   16,  7,   16,  2,   17,  7,
  17,  2,   18,  7,   18,  2,   19,  7,   19,  2,   20,  7,   20,  2,   21,
  7,   21,  2,   22,  7,   22,  2,   23,  7,   23,  2,   24,  7,   24,  2,
  25,  7,   25,  2,   26,  7,   26,  2,   27,  7,   27,  2,   28,  7,   28,
  2,   29,  7,   29,  2,   30,  7,   30,  2,   31,  7,   31,  2,   32,  7,
  32,  2,   33,  7,   33,  2,   34,  7,   34,  2,   35,  7,   35,  2,   36,
  7,   36,  2,   37,  7,   37,  2,   38,  7,   38,  2,   39,  7,   39,  2,
  40,  7,   40,  1,   0,   3,   0,   84,  8,   0,   1,   0,   5,   0,   87,
  8,   0,   10,  0,   12,  0,   90,  9,   0,   1,   0,   4,   0,   93,  8,
  0,   11,  0,   12,  0,   94,  1,   0,   1,   0,   1,   1,   1,   1,   1,
  1,   1,   1,   3,   1,   103, 8,   1,   1,   2,   1,   2,   1,   2,   1,
  2,   1,   2,   1,   2,   1,   2,   1,   2,   1,   2,   3,   2,   114, 8,
  2,   1,   3,   1,   3,   3,   3,   118, 8,   3,   1,   4,   1,   4,   1,
  4,   1,   4,   4,   4,   124, 8,   4,   11,  4,   12,  4,   125, 1,   4,
  1,   4,   1,   4,   1,   4,   1,   4,   1,   4,   1,   4,   1,   4,   3,
  4,   136, 8,   4,   1,   5,   1,   5,   3,   5,   140, 8,   5,   1,   6,
  1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,
  6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,
  1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,   6,   1,
  6,   1,   6,   1,   6,   1,   6,   1,   6,   3,   6,   170, 8,   6,   1,
  7,   1,   7,   1,   7,   1,   7,   1,   7,   1,   7,   1,   8,   1,   8,
  3,   8,   180, 8,   8,   1,   8,   1,   8,   1,   8,   3,   8,   185, 8,
  8,   1,   8,   1,   8,   1,   8,   3,   8,   190, 8,   8,   1,   9,   1,
  9,   1,   9,   5,   9,   195, 8,   9,   10,  9,   12,  9,   198, 9,   9,
  1,   10,  5,   10,  201, 8,   10,  10,  10,  12,  10,  204, 9,   10,  1,
  10,  1,   10,  1,   11,  1,   11,  1,   11,  3,   11,  211, 8,   11,  1,
  12,  1,   12,  1,   12,  1,   12,  4,   12,  217, 8,   12,  11,  12,  12,
  12,  218, 1,   12,  1,   12,  1,   12,  1,   12,  1,   12,  1,   12,  1,
  12,  1,   12,  1,   12,  1,   12,  1,   12,  1,   12,  1,   12,  3,   12,
  234, 8,   12,  1,   13,  1,   13,  1,   13,  3,   13,  239, 8,   13,  1,
  14,  1,   14,  1,   14,  3,   14,  244, 8,   14,  1,   14,  3,   14,  247,
  8,   14,  1,   14,  1,   14,  3,   14,  251, 8,   14,  1,   15,  1,   15,
  1,   15,  1,   15,  1,   15,  1,   15,  1,   15,  1,   15,  1,   15,  1,
  15,  1,   15,  1,   15,  3,   15,  265, 8,   15,  1,   16,  1,   16,  1,
  16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,
  1,   16,  1,   16,  1,   16,  3,   16,  280, 8,   16,  1,   16,  1,   16,
  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,
  16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,
  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,
  16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,  1,   16,
  5,   16,  314, 8,   16,  10,  16,  12,  16,  317, 9,   16,  1,   17,  1,
  17,  1,   17,  1,   17,  3,   17,  323, 8,   17,  1,   17,  1,   17,  1,
  17,  1,   17,  1,   17,  1,   17,  1,   17,  3,   17,  332, 8,   17,  1,
  17,  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,
  1,   17,  3,   17,  343, 8,   17,  1,   17,  1,   17,  1,   17,  1,   17,
  3,   17,  349, 8,   17,  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,
  3,   17,  356, 8,   17,  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,
  1,   17,  1,   17,  1,   17,  1,   17,  1,   17,  5,   17,  368, 8,   17,
  10,  17,  12,  17,  371, 9,   17,  1,   18,  4,   18,  374, 8,   18,  11,
  18,  12,  18,  375, 1,   19,  1,   19,  1,   19,  1,   19,  1,   19,  1,
  19,  1,   19,  3,   19,  385, 8,   19,  1,   20,  3,   20,  388, 8,   20,
  1,   20,  1,   20,  3,   20,  392, 8,   20,  1,   20,  3,   20,  395, 8,
  20,  1,   21,  1,   21,  3,   21,  399, 8,   21,  1,   21,  1,   21,  1,
  22,  1,   22,  1,   22,  5,   22,  406, 8,   22,  10,  22,  12,  22,  409,
  9,   22,  1,   22,  3,   22,  412, 8,   22,  1,   23,  1,   23,  1,   23,
  1,   23,  1,   24,  1,   24,  1,   24,  5,   24,  421, 8,   24,  10,  24,
  12,  24,  424, 9,   24,  1,   24,  3,   24,  427, 8,   24,  1,   25,  1,
  25,  1,   25,  1,   25,  1,   25,  1,   25,  1,   25,  1,   25,  1,   25,
  1,   25,  1,   25,  3,   25,  440, 8,   25,  1,   26,  1,   26,  3,   26,
  444, 8,   26,  1,   27,  1,   27,  1,   28,  4,   28,  449, 8,   28,  11,
  28,  12,  28,  450, 1,   29,  1,   29,  1,   29,  1,   29,  1,   29,  1,
  29,  1,   29,  3,   29,  460, 8,   29,  1,   30,  1,   30,  1,   30,  1,
  30,  1,   30,  1,   30,  1,   30,  1,   30,  1,   30,  1,   30,  1,   30,
  1,   30,  1,   30,  1,   30,  3,   30,  476, 8,   30,  1,   31,  1,   31,
  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,
  31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,
  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  1,   31,  3,
  31,  502, 8,   31,  1,   32,  1,   32,  1,   33,  1,   33,  1,   33,  3,
  33,  509, 8,   33,  1,   34,  1,   34,  1,   35,  1,   35,  1,   35,  5,
  35,  516, 8,   35,  10,  35,  12,  35,  519, 9,   35,  1,   35,  1,   35,
  1,   35,  5,   35,  524, 8,   35,  10,  35,  12,  35,  527, 9,   35,  1,
  35,  1,   35,  1,   35,  3,   35,  532, 8,   35,  1,   36,  1,   36,  1,
  37,  1,   37,  1,   38,  1,   38,  1,   38,  1,   39,  1,   39,  1,   40,
  1,   40,  1,   40,  0,   2,   32,  34,  41,  0,   2,   4,   6,   8,   10,
  12,  14,  16,  18,  20,  22,  24,  26,  28,  30,  32,  34,  36,  38,  40,
  42,  44,  46,  48,  50,  52,  54,  56,  58,  60,  62,  64,  66,  68,  70,
  72,  74,  76,  78,  80,  0,   7,   2,   0,   6,   6,   12,  12,  3,   0,
  6,   6,   12,  12,  18,  18,  2,   0,   19,  19,  28,  29,  2,   0,   18,
  18,  23,  23,  2,   0,   10,  11,  16,  17,  2,   0,   9,   9,   20,  20,
  2,   0,   32,  43,  45,  63,  590, 0,   83,  1,   0,   0,   0,   2,   98,
  1,   0,   0,   0,   4,   113, 1,   0,   0,   0,   6,   117, 1,   0,   0,
  0,   8,   135, 1,   0,   0,   0,   10,  139, 1,   0,   0,   0,   12,  169,
  1,   0,   0,   0,   14,  171, 1,   0,   0,   0,   16,  189, 1,   0,   0,
  0,   18,  191, 1,   0,   0,   0,   20,  202, 1,   0,   0,   0,   22,  207,
  1,   0,   0,   0,   24,  233, 1,   0,   0,   0,   26,  238, 1,   0,   0,
  0,   28,  250, 1,   0,   0,   0,   30,  264, 1,   0,   0,   0,   32,  279,
  1,   0,   0,   0,   34,  348, 1,   0,   0,   0,   36,  373, 1,   0,   0,
  0,   38,  384, 1,   0,   0,   0,   40,  394, 1,   0,   0,   0,   42,  396,
  1,   0,   0,   0,   44,  402, 1,   0,   0,   0,   46,  413, 1,   0,   0,
  0,   48,  417, 1,   0,   0,   0,   50,  439, 1,   0,   0,   0,   52,  443,
  1,   0,   0,   0,   54,  445, 1,   0,   0,   0,   56,  448, 1,   0,   0,
  0,   58,  459, 1,   0,   0,   0,   60,  475, 1,   0,   0,   0,   62,  501,
  1,   0,   0,   0,   64,  503, 1,   0,   0,   0,   66,  508, 1,   0,   0,
  0,   68,  510, 1,   0,   0,   0,   70,  531, 1,   0,   0,   0,   72,  533,
  1,   0,   0,   0,   74,  535, 1,   0,   0,   0,   76,  537, 1,   0,   0,
  0,   78,  540, 1,   0,   0,   0,   80,  542, 1,   0,   0,   0,   82,  84,
  3,   2,   1,   0,   83,  82,  1,   0,   0,   0,   83,  84,  1,   0,   0,
  0,   84,  88,  1,   0,   0,   0,   85,  87,  3,   4,   2,   0,   86,  85,
  1,   0,   0,   0,   87,  90,  1,   0,   0,   0,   88,  86,  1,   0,   0,
  0,   88,  89,  1,   0,   0,   0,   89,  92,  1,   0,   0,   0,   90,  88,
  1,   0,   0,   0,   91,  93,  3,   6,   3,   0,   92,  91,  1,   0,   0,
  0,   93,  94,  1,   0,   0,   0,   94,  92,  1,   0,   0,   0,   94,  95,
  1,   0,   0,   0,   95,  96,  1,   0,   0,   0,   96,  97,  5,   0,   0,
  1,   97,  1,   1,   0,   0,   0,   98,  99,  5,   44,  0,   0,   99,  100,
  5,   2,   0,   0,   100, 102, 5,   70,  0,   0,   101, 103, 5,   27,  0,
  0,   102, 101, 1,   0,   0,   0,   102, 103, 1,   0,   0,   0,   103, 3,
  1,   0,   0,   0,   104, 105, 5,   36,  0,   0,   105, 106, 5,   70,  0,
  0,   106, 114, 5,   27,  0,   0,   107, 108, 5,   36,  0,   0,   108, 109,
  5,   70,  0,   0,   109, 110, 3,   76,  38,  0,   110, 111, 3,   64,  32,
  0,   111, 112, 5,   27,  0,   0,   112, 114, 1,   0,   0,   0,   113, 104,
  1,   0,   0,   0,   113, 107, 1,   0,   0,   0,   114, 5,   1,   0,   0,
  0,   115, 118, 3,   12,  6,   0,   116, 118, 3,   8,   4,   0,   117, 115,
  1,   0,   0,   0,   117, 116, 1,   0,   0,   0,   118, 7,   1,   0,   0,
  0,   119, 120, 5,   42,  0,   0,   120, 121, 3,   66,  33,  0,   121, 123,
  5,   13,  0,   0,   122, 124, 3,   10,  5,   0,   123, 122, 1,   0,   0,
  0,   124, 125, 1,   0,   0,   0,   125, 123, 1,   0,   0,   0,   125, 126,
  1,   0,   0,   0,   126, 127, 1,   0,   0,   0,   127, 128, 5,   24,  0,
  0,   128, 136, 1,   0,   0,   0,   129, 130, 5,   42,  0,   0,   130, 131,
  3,   66,  33,  0,   131, 132, 5,   13,  0,   0,   132, 133, 6,   4,   -1,
  0,   133, 134, 5,   24,  0,   0,   134, 136, 1,   0,   0,   0,   135, 119,
  1,   0,   0,   0,   135, 129, 1,   0,   0,   0,   136, 9,   1,   0,   0,
  0,   137, 140, 3,   12,  6,   0,   138, 140, 3,   24,  12,  0,   139, 137,
  1,   0,   0,   0,   139, 138, 1,   0,   0,   0,   140, 11,  1,   0,   0,
  0,   141, 142, 5,   34,  0,   0,   142, 143, 3,   80,  40,  0,   143, 144,
  3,   16,  8,   0,   144, 145, 5,   13,  0,   0,   145, 146, 3,   20,  10,
  0,   146, 147, 5,   24,  0,   0,   147, 170, 1,   0,   0,   0,   148, 149,
  5,   34,  0,   0,   149, 150, 3,   80,  40,  0,   150, 151, 3,   16,  8,
  0,   151, 152, 5,   13,  0,   0,   152, 153, 6,   6,   -1,  0,   153, 154,
  5,   24,  0,   0,   154, 170, 1,   0,   0,   0,   155, 156, 5,   34,  0,
  0,   156, 157, 3,   80,  40,  0,   157, 158, 6,   6,   -1,  0,   158, 159,
  5,   13,  0,   0,   159, 160, 3,   20,  10,  0,   160, 161, 5,   24,  0,
  0,   161, 170, 1,   0,   0,   0,   162, 163, 5,   34,  0,   0,   163, 164,
  6,   6,   -1,  0,   164, 165, 3,   16,  8,   0,   165, 166, 5,   13,  0,
  0,   166, 167, 3,   20,  10,  0,   167, 168, 5,   24,  0,   0,   168, 170,
  1,   0,   0,   0,   169, 141, 1,   0,   0,   0,   169, 148, 1,   0,   0,
  0,   169, 155, 1,   0,   0,   0,   169, 162, 1,   0,   0,   0,   170, 13,
  1,   0,   0,   0,   171, 172, 5,   39,  0,   0,   172, 173, 3,   78,  39,
  0,   173, 174, 5,   2,   0,   0,   174, 175, 3,   32,  16,  0,   175, 176,
  5,   27,  0,   0,   176, 15,  1,   0,   0,   0,   177, 179, 5,   15,  0,
  0,   178, 180, 3,   18,  9,   0,   179, 178, 1,   0,   0,   0,   179, 180,
  1,   0,   0,   0,   180, 181, 1,   0,   0,   0,   181, 190, 5,   26,  0,
  0,   182, 184, 5,   15,  0,   0,   183, 185, 3,   18,  9,   0,   184, 183,
  1,   0,   0,   0,   184, 185, 1,   0,   0,   0,   185, 186, 1,   0,   0,
  0,   186, 187, 5,   26,  0,   0,   187, 188, 6,   8,   -1,  0,   188, 190,
  5,   26,  0,   0,   189, 177, 1,   0,   0,   0,   189, 182, 1,   0,   0,
  0,   190, 17,  1,   0,   0,   0,   191, 196, 3,   78,  39,  0,   192, 193,
  5,   5,   0,   0,   193, 195, 3,   78,  39,  0,   194, 192, 1,   0,   0,
  0,   195, 198, 1,   0,   0,   0,   196, 194, 1,   0,   0,   0,   196, 197,
  1,   0,   0,   0,   197, 19,  1,   0,   0,   0,   198, 196, 1,   0,   0,
  0,   199, 201, 3,   14,  7,   0,   200, 199, 1,   0,   0,   0,   201, 204,
  1,   0,   0,   0,   202, 200, 1,   0,   0,   0,   202, 203, 1,   0,   0,
  0,   203, 205, 1,   0,   0,   0,   204, 202, 1,   0,   0,   0,   205, 206,
  3,   22,  11,  0,   206, 21,  1,   0,   0,   0,   207, 208, 5,   41,  0,
  0,   208, 210, 3,   32,  16,  0,   209, 211, 5,   27,  0,   0,   210, 209,
  1,   0,   0,   0,   210, 211, 1,   0,   0,   0,   211, 23,  1,   0,   0,
  0,   212, 213, 5,   43,  0,   0,   213, 214, 3,   56,  28,  0,   214, 216,
  5,   13,  0,   0,   215, 217, 3,   26,  13,  0,   216, 215, 1,   0,   0,
  0,   217, 218, 1,   0,   0,   0,   218, 216, 1,   0,   0,   0,   218, 219,
  1,   0,   0,   0,   219, 220, 1,   0,   0,   0,   220, 221, 5,   24,  0,
  0,   221, 234, 1,   0,   0,   0,   222, 223, 5,   43,  0,   0,   223, 224,
  3,   56,  28,  0,   224, 225, 5,   13,  0,   0,   225, 226, 6,   12,  -1,
  0,   226, 227, 5,   24,  0,   0,   227, 234, 1,   0,   0,   0,   228, 229,
  6,   12,  -1,  0,   229, 230, 3,   56,  28,  0,   230, 231, 5,   13,  0,
  0,   231, 232, 5,   24,  0,   0,   232, 234, 1,   0,   0,   0,   233, 212,
  1,   0,   0,   0,   233, 222, 1,   0,   0,   0,   233, 228, 1,   0,   0,
  0,   234, 25,  1,   0,   0,   0,   235, 239, 3,   12,  6,   0,   236, 239,
  3,   28,  14,  0,   237, 239, 3,   24,  12,  0,   238, 235, 1,   0,   0,
  0,   238, 236, 1,   0,   0,   0,   238, 237, 1,   0,   0,   0,   239, 27,
  1,   0,   0,   0,   240, 241, 5,   32,  0,   0,   241, 243, 3,   70,  35,
  0,   242, 244, 3,   30,  15,  0,   243, 242, 1,   0,   0,   0,   243, 244,
  1,   0,   0,   0,   244, 246, 1,   0,   0,   0,   245, 247, 5,   27,  0,
  0,   246, 245, 1,   0,   0,   0,   246, 247, 1,   0,   0,   0,   247, 251,
  1,   0,   0,   0,   248, 249, 5,   32,  0,   0,   249, 251, 6,   14,  -1,
  0,   250, 240, 1,   0,   0,   0,   250, 248, 1,   0,   0,   0,   251, 29,
  1,   0,   0,   0,   252, 253, 5,   4,   0,   0,   253, 254, 5,   35,  0,
  0,   254, 265, 3,   32,  16,  0,   255, 256, 6,   15,  -1,  0,   256, 257,
  5,   35,  0,   0,   257, 265, 3,   32,  16,  0,   258, 259, 5,   4,   0,
  0,   259, 260, 6,   15,  -1,  0,   260, 265, 3,   32,  16,  0,   261, 262,
  5,   4,   0,   0,   262, 263, 5,   35,  0,   0,   263, 265, 6,   15,  -1,
  0,   264, 252, 1,   0,   0,   0,   264, 255, 1,   0,   0,   0,   264, 258,
  1,   0,   0,   0,   264, 261, 1,   0,   0,   0,   265, 31,  1,   0,   0,
  0,   266, 267, 6,   16,  -1,  0,   267, 280, 3,   34,  17,  0,   268, 269,
  3,   34,  17,  0,   269, 270, 7,   0,   0,   0,   270, 271, 6,   16,  -1,
  0,   271, 280, 1,   0,   0,   0,   272, 273, 7,   0,   0,   0,   273, 274,
  6,   16,  -1,  0,   274, 280, 3,   34,  17,  0,   275, 276, 7,   1,   0,
  0,   276, 280, 3,   34,  17,  0,   277, 278, 5,   21,  0,   0,   278, 280,
  3,   32,  16,  10,  279, 266, 1,   0,   0,   0,   279, 268, 1,   0,   0,
  0,   279, 272, 1,   0,   0,   0,   279, 275, 1,   0,   0,   0,   279, 277,
  1,   0,   0,   0,   280, 315, 1,   0,   0,   0,   281, 282, 10,  9,   0,
  0,   282, 283, 7,   2,   0,   0,   283, 314, 3,   32,  16,  10,  284, 285,
  10,  8,   0,   0,   285, 286, 7,   3,   0,   0,   286, 314, 3,   32,  16,
  9,   287, 288, 10,  7,   0,   0,   288, 289, 7,   4,   0,   0,   289, 314,
  3,   32,  16,  8,   290, 291, 10,  6,   0,   0,   291, 292, 7,   5,   0,
  0,   292, 314, 3,   32,  16,  7,   293, 294, 10,  4,   0,   0,   294, 295,
  5,   37,  0,   0,   295, 314, 3,   32,  16,  5,   296, 297, 10,  3,   0,
  0,   297, 298, 5,   1,   0,   0,   298, 314, 3,   32,  16,  4,   299, 300,
  10,  2,   0,   0,   300, 301, 5,   22,  0,   0,   301, 314, 3,   32,  16,
  3,   302, 303, 10,  1,   0,   0,   303, 304, 5,   31,  0,   0,   304, 305,
  3,   32,  16,  0,   305, 306, 5,   4,   0,   0,   306, 307, 3,   32,  16,
  1,   307, 314, 1,   0,   0,   0,   308, 309, 10,  5,   0,   0,   309, 310,
  5,   38,  0,   0,   310, 311, 3,   68,  34,  0,   311, 312, 6,   16,  -1,
  0,   312, 314, 1,   0,   0,   0,   313, 281, 1,   0,   0,   0,   313, 284,
  1,   0,   0,   0,   313, 287, 1,   0,   0,   0,   313, 290, 1,   0,   0,
  0,   313, 293, 1,   0,   0,   0,   313, 296, 1,   0,   0,   0,   313, 299,
  1,   0,   0,   0,   313, 302, 1,   0,   0,   0,   313, 308, 1,   0,   0,
  0,   314, 317, 1,   0,   0,   0,   315, 313, 1,   0,   0,   0,   315, 316,
  1,   0,   0,   0,   316, 33,  1,   0,   0,   0,   317, 315, 1,   0,   0,
  0,   318, 319, 6,   17,  -1,  0,   319, 349, 3,   36,  18,  0,   320, 322,
  5,   14,  0,   0,   321, 323, 3,   48,  24,  0,   322, 321, 1,   0,   0,
  0,   322, 323, 1,   0,   0,   0,   323, 324, 1,   0,   0,   0,   324, 349,
  5,   25,  0,   0,   325, 349, 3,   42,  21,  0,   326, 327, 3,   64,  32,
  0,   327, 328, 5,   8,   0,   0,   328, 329, 3,   74,  37,  0,   329, 331,
  5,   15,  0,   0,   330, 332, 3,   48,  24,  0,   331, 330, 1,   0,   0,
  0,   331, 332, 1,   0,   0,   0,   332, 333, 1,   0,   0,   0,   333, 334,
  5,   26,  0,   0,   334, 349, 1,   0,   0,   0,   335, 336, 5,   15,  0,
  0,   336, 337, 3,   32,  16,  0,   337, 338, 5,   26,  0,   0,   338, 349,
  1,   0,   0,   0,   339, 340, 3,   80,  40,  0,   340, 342, 5,   15,  0,
  0,   341, 343, 3,   48,  24,  0,   342, 341, 1,   0,   0,   0,   342, 343,
  1,   0,   0,   0,   343, 344, 1,   0,   0,   0,   344, 345, 5,   26,  0,
  0,   345, 349, 1,   0,   0,   0,   346, 349, 3,   78,  39,  0,   347, 349,
  3,   50,  25,  0,   348, 318, 1,   0,   0,   0,   348, 320, 1,   0,   0,
  0,   348, 325, 1,   0,   0,   0,   348, 326, 1,   0,   0,   0,   348, 335,
  1,   0,   0,   0,   348, 339, 1,   0,   0,   0,   348, 346, 1,   0,   0,
  0,   348, 347, 1,   0,   0,   0,   349, 369, 1,   0,   0,   0,   350, 351,
  10,  7,   0,   0,   351, 352, 5,   8,   0,   0,   352, 353, 3,   74,  37,
  0,   353, 355, 5,   15,  0,   0,   354, 356, 3,   48,  24,  0,   355, 354,
  1,   0,   0,   0,   355, 356, 1,   0,   0,   0,   356, 357, 1,   0,   0,
  0,   357, 358, 5,   26,  0,   0,   358, 368, 1,   0,   0,   0,   359, 360,
  10,  5,   0,   0,   360, 361, 5,   8,   0,   0,   361, 368, 3,   52,  26,
  0,   362, 363, 10,  4,   0,   0,   363, 364, 5,   14,  0,   0,   364, 365,
  3,   40,  20,  0,   365, 366, 5,   25,  0,   0,   366, 368, 1,   0,   0,
  0,   367, 350, 1,   0,   0,   0,   367, 359, 1,   0,   0,   0,   367, 362,
  1,   0,   0,   0,   368, 371, 1,   0,   0,   0,   369, 367, 1,   0,   0,
  0,   369, 370, 1,   0,   0,   0,   370, 35,  1,   0,   0,   0,   371, 369,
  1,   0,   0,   0,   372, 374, 3,   38,  19,  0,   373, 372, 1,   0,   0,
  0,   374, 375, 1,   0,   0,   0,   375, 373, 1,   0,   0,   0,   375, 376,
  1,   0,   0,   0,   376, 37,  1,   0,   0,   0,   377, 385, 3,   58,  29,
  0,   378, 379, 5,   28,  0,   0,   379, 380, 5,   7,   0,   0,   380, 381,
  5,   15,  0,   0,   381, 382, 3,   32,  16,  0,   382, 383, 5,   26,  0,
  0,   383, 385, 1,   0,   0,   0,   384, 377, 1,   0,   0,   0,   384, 378,
  1,   0,   0,   0,   385, 39,  1,   0,   0,   0,   386, 388, 3,   32,  16,
  0,   387, 386, 1,   0,   0,   0,   387, 388, 1,   0,   0,   0,   388, 389,
  1,   0,   0,   0,   389, 391, 5,   4,   0,   0,   390, 392, 3,   32,  16,
  0,   391, 390, 1,   0,   0,   0,   391, 392, 1,   0,   0,   0,   392, 395,
  1,   0,   0,   0,   393, 395, 3,   32,  16,  0,   394, 387, 1,   0,   0,
  0,   394, 393, 1,   0,   0,   0,   395, 41,  1,   0,   0,   0,   396, 398,
  5,   13,  0,   0,   397, 399, 3,   44,  22,  0,   398, 397, 1,   0,   0,
  0,   398, 399, 1,   0,   0,   0,   399, 400, 1,   0,   0,   0,   400, 401,
  5,   24,  0,   0,   401, 43,  1,   0,   0,   0,   402, 407, 3,   46,  23,
  0,   403, 404, 5,   5,   0,   0,   404, 406, 3,   46,  23,  0,   405, 403,
  1,   0,   0,   0,   406, 409, 1,   0,   0,   0,   407, 405, 1,   0,   0,
  0,   407, 408, 1,   0,   0,   0,   408, 411, 1,   0,   0,   0,   409, 407,
  1,   0,   0,   0,   410, 412, 5,   5,   0,   0,   411, 410, 1,   0,   0,
  0,   411, 412, 1,   0,   0,   0,   412, 45,  1,   0,   0,   0,   413, 414,
  3,   32,  16,  0,   414, 415, 5,   4,   0,   0,   415, 416, 3,   32,  16,
  0,   416, 47,  1,   0,   0,   0,   417, 422, 3,   32,  16,  0,   418, 419,
  5,   5,   0,   0,   419, 421, 3,   32,  16,  0,   420, 418, 1,   0,   0,
  0,   421, 424, 1,   0,   0,   0,   422, 420, 1,   0,   0,   0,   422, 423,
  1,   0,   0,   0,   423, 426, 1,   0,   0,   0,   424, 422, 1,   0,   0,
  0,   425, 427, 5,   5,   0,   0,   426, 425, 1,   0,   0,   0,   426, 427,
  1,   0,   0,   0,   427, 49,  1,   0,   0,   0,   428, 440, 5,   67,  0,
  0,   429, 440, 5,   66,  0,   0,   430, 440, 5,   70,  0,   0,   431, 440,
  5,   71,  0,   0,   432, 440, 5,   45,  0,   0,   433, 440, 5,   33,  0,
  0,   434, 440, 5,   40,  0,   0,   435, 436, 5,   69,  0,   0,   436, 440,
  6,   25,  -1,  0,   437, 438, 5,   68,  0,   0,   438, 440, 6,   25,  -1,
  0,   439, 428, 1,   0,   0,   0,   439, 429, 1,   0,   0,   0,   439, 430,
  1,   0,   0,   0,   439, 431, 1,   0,   0,   0,   439, 432, 1,   0,   0,
  0,   439, 433, 1,   0,   0,   0,   439, 434, 1,   0,   0,   0,   439, 435,
  1,   0,   0,   0,   439, 437, 1,   0,   0,   0,   440, 51,  1,   0,   0,
  0,   441, 444, 5,   65,  0,   0,   442, 444, 3,   54,  27,  0,   443, 441,
  1,   0,   0,   0,   443, 442, 1,   0,   0,   0,   444, 53,  1,   0,   0,
  0,   445, 446, 7,   6,   0,   0,   446, 55,  1,   0,   0,   0,   447, 449,
  3,   58,  29,  0,   448, 447, 1,   0,   0,   0,   449, 450, 1,   0,   0,
  0,   450, 448, 1,   0,   0,   0,   450, 451, 1,   0,   0,   0,   451, 57,
  1,   0,   0,   0,   452, 460, 5,   64,  0,   0,   453, 454, 5,   28,  0,
  0,   454, 460, 3,   62,  31,  0,   455, 456, 5,   28,  0,   0,   456, 460,
  3,   60,  30,  0,   457, 458, 6,   29,  -1,  0,   458, 460, 5,   28,  0,
  0,   459, 452, 1,   0,   0,   0,   459, 453, 1,   0,   0,   0,   459, 455,
  1,   0,   0,   0,   459, 457, 1,   0,   0,   0,   460, 59,  1,   0,   0,
  0,   461, 462, 5,   13,  0,   0,   462, 463, 3,   78,  39,  0,   463, 464,
  5,   2,   0,   0,   464, 465, 5,   30,  0,   0,   465, 466, 5,   24,  0,
  0,   466, 476, 1,   0,   0,   0,   467, 468, 5,   13,  0,   0,   468, 469,
  3,   78,  39,  0,   469, 470, 5,   2,   0,   0,   470, 471, 5,   30,  0,
  0,   471, 472, 5,   24,  0,   0,   472, 473, 6,   30,  -1,  0,   473, 474,
  5,   24,  0,   0,   474, 476, 1,   0,   0,   0,   475, 461, 1,   0,   0,
  0,   475, 467, 1,   0,   0,   0,   476, 61,  1,   0,   0,   0,   477, 478,
  5,   13,  0,   0,   478, 479, 3,   78,  39,  0,   479, 480, 5,   24,  0,
  0,   480, 502, 1,   0,   0,   0,   481, 482, 5,   13,  0,   0,   482, 483,
  3,   78,  39,  0,   483, 484, 5,   2,   0,   0,   484, 485, 5,   29,  0,
  0,   485, 486, 5,   24,  0,   0,   486, 502, 1,   0,   0,   0,   487, 488,
  5,   13,  0,   0,   488, 489, 3,   78,  39,  0,   489, 490, 5,   24,  0,
  0,   490, 491, 6,   31,  -1,  0,   491, 492, 5,   24,  0,   0,   492, 502,
  1,   0,   0,   0,   493, 494, 5,   13,  0,   0,   494, 495, 3,   78,  39,
  0,   495, 496, 5,   2,   0,   0,   496, 497, 5,   29,  0,   0,   497, 498,
  5,   24,  0,   0,   498, 499, 6,   31,  -1,  0,   499, 500, 5,   24,  0,
  0,   500, 502, 1,   0,   0,   0,   501, 477, 1,   0,   0,   0,   501, 481,
  1,   0,   0,   0,   501, 487, 1,   0,   0,   0,   501, 493, 1,   0,   0,
  0,   502, 63,  1,   0,   0,   0,   503, 504, 5,   65,  0,   0,   504, 65,
  1,   0,   0,   0,   505, 506, 6,   33,  -1,  0,   506, 509, 5,   76,  0,
  0,   507, 509, 5,   77,  0,   0,   508, 505, 1,   0,   0,   0,   508, 507,
  1,   0,   0,   0,   509, 67,  1,   0,   0,   0,   510, 511, 3,   64,  32,
  0,   511, 69,  1,   0,   0,   0,   512, 517, 3,   64,  32,  0,   513, 514,
  5,   5,   0,   0,   514, 516, 3,   64,  32,  0,   515, 513, 1,   0,   0,
  0,   516, 519, 1,   0,   0,   0,   517, 515, 1,   0,   0,   0,   517, 518,
  1,   0,   0,   0,   518, 532, 1,   0,   0,   0,   519, 517, 1,   0,   0,
  0,   520, 525, 3,   64,  32,  0,   521, 522, 5,   5,   0,   0,   522, 524,
  3,   64,  32,  0,   523, 521, 1,   0,   0,   0,   524, 527, 1,   0,   0,
  0,   525, 523, 1,   0,   0,   0,   525, 526, 1,   0,   0,   0,   526, 528,
  1,   0,   0,   0,   527, 525, 1,   0,   0,   0,   528, 529, 6,   35,  -1,
  0,   529, 530, 5,   5,   0,   0,   530, 532, 1,   0,   0,   0,   531, 512,
  1,   0,   0,   0,   531, 520, 1,   0,   0,   0,   532, 71,  1,   0,   0,
  0,   533, 534, 3,   64,  32,  0,   534, 73,  1,   0,   0,   0,   535, 536,
  3,   64,  32,  0,   536, 75,  1,   0,   0,   0,   537, 538, 6,   38,  -1,
  0,   538, 539, 3,   64,  32,  0,   539, 77,  1,   0,   0,   0,   540, 541,
  3,   64,  32,  0,   541, 79,  1,   0,   0,   0,   542, 543, 3,   64,  32,
  0,   543, 81,  1,   0,   0,   0,   53,  83,  88,  94,  102, 113, 117, 125,
  135, 139, 169, 179, 184, 189, 196, 202, 210, 218, 233, 238, 243, 246, 250,
  264, 279, 313, 315, 322, 331, 342, 348, 355, 367, 369, 375, 384, 387, 391,
  394, 398, 407, 411, 422, 426, 439, 443, 450, 459, 475, 501, 508, 517, 525,
  531
];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA =
    atn.decisionToState.map((ds, index) => new antlr4.dfa.DFA(ds, index));

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class FirebaseRulesParser extends antlr4.Parser {
  static grammarFileName = 'FirebaseRulesParser.g4';
  static literalNames = [
    null,          '\'&&\'',        '\'=\'',
    '\'@\'',       '\':\'',         '\',\'',
    '\'--\'',      '\'$\'',         '\'.\'',
    '\'==\'',      '\'>\'',         '\'>=\'',
    '\'++\'',      '\'{\'',         '\'[\'',
    '\'(\'',       '\'<\'',         '\'<=\'',
    '\'-\'',       '\'%\'',         '\'!=\'',
    '\'!\'',       '\'||\'',        '\'+\'',
    '\'}\'',       '\']\'',         '\')\'',
    '\';\'',       '\'/\'',         '\'*\'',
    '\'**\'',      '\'?\'',         '\'allow\'',
    '\'false\'',   '\'function\'',  '\'if\'',
    '\'import\'',  '\'in\'',        '\'is\'',
    '\'let\'',     '\'null\'',      '\'return\'',
    '\'service\'', '\'match\'',     '\'rules_version\'',
    '\'true\'',    '\'arguments\'', '\'break\'',
    '\'case\'',    '\'continue\'',  '\'default\'',
    '\'deny\'',    '\'do\'',        '\'each\'',
    '\'else\'',    '\'extends\'',   '\'for\'',
    '\'goto\'',    '\'not\'',       '\'package\'',
    '\'switch\'',  '\'then\'',      '\'var\'',
    '\'while\''
  ];
  static symbolicNames = [
    null,
    'AND',
    'ASSIGNMENT',
    'AT',
    'COLON',
    'COMMA',
    'DECREMENT',
    'DOLLAR',
    'DOT',
    'EQ',
    'GT',
    'GTE',
    'INCREMENT',
    'LBRACE',
    'LBRACKET',
    'LPAREN',
    'LT',
    'LTE',
    'MINUS',
    'MOD',
    'NEQ',
    'NOT',
    'OR',
    'PLUS',
    'RBRACE',
    'RBRACKET',
    'RPAREN',
    'SEMI',
    'SLASH',
    'STAR',
    'GLOB',
    'QUESTION',
    'ALLOW',
    'FALSE',
    'FUNCTION',
    'IF',
    'IMPORT',
    'IN',
    'IS',
    'LET',
    'NULL',
    'RETURN',
    'SERVICE',
    'MATCH',
    'RULES_VERSION',
    'TRUE',
    'ARGUMENTS',
    'BREAK',
    'CASE',
    'CONTINUE',
    'DEFAULT',
    'DENY',
    'DO',
    'EACH',
    'ELSE',
    'EXTENDS',
    'FOR',
    'GOTO',
    'NOT_TEXT',
    'PACKAGE',
    'SWITCH',
    'THEN',
    'VAR',
    'WHILE',
    'PATH_SEGMENT',
    'IDENTIFIER',
    'NUM_INT',
    'NUM_FLOAT',
    'UNPAIRED_DOUBLE_QUOTE',
    'UNPAIRED_SINGLE_QUOTE',
    'STRING',
    'BYTES',
    'LINE_COMMENT',
    'BLOCK_COMMENT',
    'WHITE_SPACE',
    'UNKNOWN',
    'BAD_KEYWORD',
    'SERVICE_IDENTIFIER',
    'HIDE_SPACE'
  ];
  static ruleNames = [
    'ruleset',
    'versionStatement',
    'importStatement',
    'rulesetStatement',
    'serviceDeclaration',
    'serviceStatement',
    'functionDeclaration',
    'bindingDeclaration',
    'functionSignature',
    'paramList',
    'functionBody',
    'returnStatement',
    'matchRuleDeclaration',
    'matchStatement',
    'permissionDeclaration',
    'permissionBody',
    'expression',
    'simpleExpression',
    'pathExpression',
    'pathExpressionSegment',
    'listIndex',
    'mapExpression',
    'mapEntries',
    'mapEntry',
    'expressionList',
    'literal',
    'keywordId',
    'keyword',
    'pathDecl',
    'pathDeclSegment',
    'globCapture',
    'capture',
    'id',
    'serviceId',
    'isOperatorId',
    'operationId',
    'packageId',
    'memberId',
    'as',
    'localVariableId',
    'localFunctionId'
  ];

  constructor(input) {
    super(input);
    this._interp = new antlr4.atn.ParserATNSimulator(
        this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = FirebaseRulesParser.ruleNames;
    this.literalNames = FirebaseRulesParser.literalNames;
    this.symbolicNames = FirebaseRulesParser.symbolicNames;

    this.checkDataTypeForIsOperator = function(type) {
      // stubbed out for JS eslint wrapper
    };
  }

  sempred(localctx, ruleIndex, predIndex) {
    switch (ruleIndex) {
      case 16:
        return this.expression_sempred(localctx, predIndex);
      case 17:
        return this.simpleExpression_sempred(localctx, predIndex);
      default:
        throw 'No predicate with index:' + ruleIndex;
    }
  }

  expression_sempred(localctx, predIndex) {
    switch (predIndex) {
      case 0:
        return this.precpred(this._ctx, 9);
      case 1:
        return this.precpred(this._ctx, 8);
      case 2:
        return this.precpred(this._ctx, 7);
      case 3:
        return this.precpred(this._ctx, 6);
      case 4:
        return this.precpred(this._ctx, 4);
      case 5:
        return this.precpred(this._ctx, 3);
      case 6:
        return this.precpred(this._ctx, 2);
      case 7:
        return this.precpred(this._ctx, 1);
      case 8:
        return this.precpred(this._ctx, 5);
      default:
        throw 'No predicate with index:' + predIndex;
    }
  };

  simpleExpression_sempred(localctx, predIndex) {
    switch (predIndex) {
      case 9:
        return this.precpred(this._ctx, 7);
      case 10:
        return this.precpred(this._ctx, 5);
      case 11:
        return this.precpred(this._ctx, 4);
      default:
        throw 'No predicate with index:' + predIndex;
    }
  };



  ruleset() {
    let localctx = new RulesetContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, FirebaseRulesParser.RULE_ruleset);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 83;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 44) {
        this.state = 82;
        this.versionStatement();
      }

      this.state = 88;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      while (_la === 36) {
        this.state = 85;
        this.importStatement();
        this.state = 90;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      }
      this.state = 92;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      do {
        this.state = 91;
        this.rulesetStatement();
        this.state = 94;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      } while (_la === 34 || _la === 42);
      this.state = 96;
      this.match(FirebaseRulesParser.EOF);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  versionStatement() {
    let localctx = new VersionStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, FirebaseRulesParser.RULE_versionStatement);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 98;
      this.match(FirebaseRulesParser.RULES_VERSION);
      this.state = 99;
      this.match(FirebaseRulesParser.ASSIGNMENT);
      this.state = 100;
      this.match(FirebaseRulesParser.STRING);
      this.state = 102;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 27) {
        this.state = 101;
        this.match(FirebaseRulesParser.SEMI);
      }

    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  importStatement() {
    let localctx = new ImportStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, FirebaseRulesParser.RULE_importStatement);
    try {
      this.state = 113;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 4, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 104;
          this.match(FirebaseRulesParser.IMPORT);
          this.state = 105;
          this.match(FirebaseRulesParser.STRING);
          this.state = 106;
          this.match(FirebaseRulesParser.SEMI);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 107;
          this.match(FirebaseRulesParser.IMPORT);
          this.state = 108;
          this.match(FirebaseRulesParser.STRING);
          this.state = 109;
          this.as();
          this.state = 110;
          this.id();
          this.state = 111;
          this.match(FirebaseRulesParser.SEMI);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  rulesetStatement() {
    let localctx = new RulesetStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, FirebaseRulesParser.RULE_rulesetStatement);
    try {
      this.state = 117;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 34:
          this.enterOuterAlt(localctx, 1);
          this.state = 115;
          this.functionDeclaration();
          break;
        case 42:
          this.enterOuterAlt(localctx, 2);
          this.state = 116;
          this.serviceDeclaration();
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  serviceDeclaration() {
    let localctx = new ServiceDeclarationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, FirebaseRulesParser.RULE_serviceDeclaration);
    var _la = 0;
    try {
      this.state = 135;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 7, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 119;
          this.match(FirebaseRulesParser.SERVICE);
          this.state = 120;
          this.serviceId();
          this.state = 121;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 123;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          do {
            this.state = 122;
            this.serviceStatement();
            this.state = 125;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          } while (_la === 28 ||
                   ((((_la - 34)) & ~0x1f) === 0 &&
                    ((1 << (_la - 34)) & 1073742337) !== 0));
          this.state = 127;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 129;
          this.match(FirebaseRulesParser.SERVICE);
          this.state = 130;
          this.serviceId();
          this.state = 131;
          this.match(FirebaseRulesParser.LBRACE);

          this.notifyErrorListeners(
              'The \'service\' body must contain at least one declaration.');

          this.state = 133;
          this.match(FirebaseRulesParser.RBRACE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  serviceStatement() {
    let localctx = new ServiceStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, FirebaseRulesParser.RULE_serviceStatement);
    try {
      this.state = 139;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 34:
          this.enterOuterAlt(localctx, 1);
          this.state = 137;
          this.functionDeclaration();
          break;
        case 28:
        case 43:
        case 64:
          this.enterOuterAlt(localctx, 2);
          this.state = 138;
          this.matchRuleDeclaration();
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  functionDeclaration() {
    let localctx = new FunctionDeclarationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 12, FirebaseRulesParser.RULE_functionDeclaration);
    try {
      this.state = 169;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 9, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 141;
          this.match(FirebaseRulesParser.FUNCTION);
          this.state = 142;
          this.localFunctionId();
          this.state = 143;
          this.functionSignature();
          this.state = 144;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 145;
          this.functionBody();
          this.state = 146;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 148;
          this.match(FirebaseRulesParser.FUNCTION);
          this.state = 149;
          this.localFunctionId();
          this.state = 150;
          this.functionSignature();
          this.state = 151;
          this.match(FirebaseRulesParser.LBRACE);

          this.notifyErrorListeners('Missing \'function\' body');

          this.state = 153;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 155;
          this.match(FirebaseRulesParser.FUNCTION);
          this.state = 156;
          this.localFunctionId();

          this.notifyErrorListeners('Missing \'function\' signature');

          this.state = 158;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 159;
          this.functionBody();
          this.state = 160;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 4:
          this.enterOuterAlt(localctx, 4);
          this.state = 162;
          this.match(FirebaseRulesParser.FUNCTION);

          this.notifyErrorListeners('Missing \'function\' id');

          this.state = 164;
          this.functionSignature();
          this.state = 165;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 166;
          this.functionBody();
          this.state = 167;
          this.match(FirebaseRulesParser.RBRACE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  bindingDeclaration() {
    let localctx = new BindingDeclarationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 14, FirebaseRulesParser.RULE_bindingDeclaration);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 171;
      this.match(FirebaseRulesParser.LET);
      this.state = 172;
      this.localVariableId();
      this.state = 173;
      this.match(FirebaseRulesParser.ASSIGNMENT);
      this.state = 174;
      this.expression(0);
      this.state = 175;
      this.match(FirebaseRulesParser.SEMI);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  functionSignature() {
    let localctx = new FunctionSignatureContext(this, this._ctx, this.state);
    this.enterRule(localctx, 16, FirebaseRulesParser.RULE_functionSignature);
    var _la = 0;
    try {
      this.state = 189;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 12, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 177;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 179;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 65) {
            this.state = 178;
            this.paramList();
          }

          this.state = 181;
          this.match(FirebaseRulesParser.RPAREN);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 182;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 184;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 65) {
            this.state = 183;
            this.paramList();
          }

          this.state = 186;
          this.match(FirebaseRulesParser.RPAREN);

          this.notifyErrorListeners(
              'Extra closing \')\' at the end of parameter list.');

          this.state = 188;
          this.match(FirebaseRulesParser.RPAREN);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  paramList() {
    let localctx = new ParamListContext(this, this._ctx, this.state);
    this.enterRule(localctx, 18, FirebaseRulesParser.RULE_paramList);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 191;
      this.localVariableId();
      this.state = 196;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      while (_la === 5) {
        this.state = 192;
        this.match(FirebaseRulesParser.COMMA);
        this.state = 193;
        this.localVariableId();
        this.state = 198;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  functionBody() {
    let localctx = new FunctionBodyContext(this, this._ctx, this.state);
    this.enterRule(localctx, 20, FirebaseRulesParser.RULE_functionBody);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 202;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      while (_la === 39) {
        this.state = 199;
        this.bindingDeclaration();
        this.state = 204;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      }
      this.state = 205;
      this.returnStatement();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  returnStatement() {
    let localctx = new ReturnStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 22, FirebaseRulesParser.RULE_returnStatement);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 207;
      this.match(FirebaseRulesParser.RETURN);
      this.state = 208;
      this.expression(0);
      this.state = 210;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 27) {
        this.state = 209;
        this.match(FirebaseRulesParser.SEMI);
      }

    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  matchRuleDeclaration() {
    let localctx = new MatchRuleDeclarationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 24, FirebaseRulesParser.RULE_matchRuleDeclaration);
    var _la = 0;
    try {
      this.state = 233;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 17, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 212;
          this.match(FirebaseRulesParser.MATCH);
          this.state = 213;
          this.pathDecl();
          this.state = 214;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 216;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          do {
            this.state = 215;
            this.matchStatement();
            this.state = 218;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          } while (((((_la - 28)) & ~0x1f) === 0 &&
                    ((1 << (_la - 28)) & 32849) !== 0) ||
                   _la === 64);
          this.state = 220;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 222;
          this.match(FirebaseRulesParser.MATCH);
          this.state = 223;
          this.pathDecl();
          this.state = 224;
          this.match(FirebaseRulesParser.LBRACE);

          this.notifyErrorListeners(
              'The \'match\' body must contain at least one declaration.');

          this.state = 226;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);

          this.notifyErrorListeners('Missing \'match\' keyword before path.');

          this.state = 229;
          this.pathDecl();
          this.state = 230;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 231;
          this.match(FirebaseRulesParser.RBRACE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  matchStatement() {
    let localctx = new MatchStatementContext(this, this._ctx, this.state);
    this.enterRule(localctx, 26, FirebaseRulesParser.RULE_matchStatement);
    try {
      this.state = 238;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 34:
          this.enterOuterAlt(localctx, 1);
          this.state = 235;
          this.functionDeclaration();
          break;
        case 32:
          this.enterOuterAlt(localctx, 2);
          this.state = 236;
          this.permissionDeclaration();
          break;
        case 28:
        case 43:
        case 64:
          this.enterOuterAlt(localctx, 3);
          this.state = 237;
          this.matchRuleDeclaration();
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  permissionDeclaration() {
    let localctx =
        new PermissionDeclarationContext(this, this._ctx, this.state);
    this.enterRule(
        localctx, 28, FirebaseRulesParser.RULE_permissionDeclaration);
    var _la = 0;
    try {
      this.state = 250;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 21, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 240;
          this.match(FirebaseRulesParser.ALLOW);
          this.state = 241;
          this.operationId();
          this.state = 243;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 4 || _la === 35) {
            this.state = 242;
            this.permissionBody();
          }

          this.state = 246;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 27) {
            this.state = 245;
            this.match(FirebaseRulesParser.SEMI);
          }

          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 248;
          this.match(FirebaseRulesParser.ALLOW);

          this.notifyErrorListeners(
              'Expected at least one \'operation\' after \'allow\'.');

          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  permissionBody() {
    let localctx = new PermissionBodyContext(this, this._ctx, this.state);
    this.enterRule(localctx, 30, FirebaseRulesParser.RULE_permissionBody);
    try {
      this.state = 264;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 22, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 252;
          this.match(FirebaseRulesParser.COLON);
          this.state = 253;
          this.match(FirebaseRulesParser.IF);
          this.state = 254;
          this.expression(0);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);

          this.notifyErrorListeners('Missing \':\' before \'if\' condition.');

          this.state = 256;
          this.match(FirebaseRulesParser.IF);
          this.state = 257;
          this.expression(0);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 258;
          this.match(FirebaseRulesParser.COLON);

          this.notifyErrorListeners(
              'Missing \'if\' before conditional expression.');

          this.state = 260;
          this.expression(0);
          break;

        case 4:
          this.enterOuterAlt(localctx, 4);
          this.state = 261;
          this.match(FirebaseRulesParser.COLON);
          this.state = 262;
          this.match(FirebaseRulesParser.IF);

          this.notifyErrorListeners(
              'Missing conditional expression after \'if\'.');

          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }


  expression(_p) {
    if (_p === undefined) {
      _p = 0;
    }
    const _parentctx = this._ctx;
    const _parentState = this.state;
    let localctx = new ExpressionContext(this, this._ctx, _parentState);
    let _prevctx = localctx;
    const _startState = 32;
    this.enterRecursionRule(
        localctx, 32, FirebaseRulesParser.RULE_expression, _p);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 279;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 23, this._ctx);
      switch (la_) {
        case 1:
          localctx = new PrimaryExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;

          this.state = 267;
          this.simpleExpression(0);
          break;

        case 2:
          localctx = new UnsupportedAdditivePostfixContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 268;
          this.simpleExpression(0);
          this.state = 269;
          localctx.op = this._input.LT(1);
          _la = this._input.LA(1);
          if (!(_la === 6 || _la === 12)) {
            localctx.op = this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }

          this.notifyErrorListeners(
              'Increment (++) and decrement (--) operators are not supported.');

          break;

        case 3:
          localctx = new UnsupportedAdditivePrefixContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 272;
          localctx.op = this._input.LT(1);
          _la = this._input.LA(1);
          if (!(_la === 6 || _la === 12)) {
            localctx.op = this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }

          this.notifyErrorListeners(
              'Increment (++) and decrement (--) operators are not supported.');

          this.state = 274;
          this.simpleExpression(0);
          break;

        case 4:
          localctx = new UnaryAdditiveExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 275;
          localctx.op = this._input.LT(1);
          _la = this._input.LA(1);
          if (!((((_la) & ~0x1f) === 0 && ((1 << _la) & 266304) !== 0))) {
            localctx.op = this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          this.state = 276;
          this.simpleExpression(0);
          break;

        case 5:
          localctx = new NotExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 277;
          localctx.op = this.match(FirebaseRulesParser.NOT);
          this.state = 278;
          this.expression(10);
          break;
      }
      this._ctx.stop = this._input.LT(-1);
      this.state = 315;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 25, this._ctx)
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          if (this._parseListeners !== null) {
            this.triggerExitRuleEvent();
          }
          _prevctx = localctx;
          this.state = 313;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 24, this._ctx);
          switch (la_) {
            case 1:
              localctx = new MultiplicativeExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 281;
              if (!(this.precpred(this._ctx, 9))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 9)');
              }
              this.state = 282;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!((((_la) & ~0x1f) === 0 &&
                     ((1 << _la) & 805830656) !== 0))) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 283;
              this.expression(10);
              break;

            case 2:
              localctx = new AdditiveExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 284;
              if (!(this.precpred(this._ctx, 8))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 8)');
              }
              this.state = 285;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!(_la === 18 || _la === 23)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 286;
              this.expression(9);
              break;

            case 3:
              localctx = new RelationalExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 287;
              if (!(this.precpred(this._ctx, 7))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 7)');
              }
              this.state = 288;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!((((_la) & ~0x1f) === 0 && ((1 << _la) & 199680) !== 0))) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 289;
              this.expression(8);
              break;

            case 4:
              localctx = new EqualityExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 290;
              if (!(this.precpred(this._ctx, 6))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 6)');
              }
              this.state = 291;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!(_la === 9 || _la === 20)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 292;
              this.expression(7);
              break;

            case 5:
              localctx = new ExprInExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 293;
              if (!(this.precpred(this._ctx, 4))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 4)');
              }
              this.state = 294;
              localctx.op = this.match(FirebaseRulesParser.IN);
              this.state = 295;
              this.expression(5);
              break;

            case 6:
              localctx = new LogicalAndExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 296;
              if (!(this.precpred(this._ctx, 3))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 3)');
              }
              this.state = 297;
              localctx.op = this.match(FirebaseRulesParser.AND);
              this.state = 298;
              this.expression(4);
              break;

            case 7:
              localctx = new LogicalOrExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 299;
              if (!(this.precpred(this._ctx, 2))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 2)');
              }
              this.state = 300;
              localctx.op = this.match(FirebaseRulesParser.OR);
              this.state = 301;
              this.expression(3);
              break;

            case 8:
              localctx = new TernaryExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 302;
              if (!(this.precpred(this._ctx, 1))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 1)');
              }
              this.state = 303;
              localctx.op = this.match(FirebaseRulesParser.QUESTION);
              this.state = 304;
              this.expression(0);
              this.state = 305;
              this.match(FirebaseRulesParser.COLON);
              this.state = 306;
              this.expression(1);
              break;

            case 9:
              localctx = new ExprIsTypeIdExpressionContext(
                  this, new ExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState, FirebaseRulesParser.RULE_expression);
              this.state = 308;
              if (!(this.precpred(this._ctx, 5))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 5)');
              }
              this.state = 309;
              localctx.op = this.match(FirebaseRulesParser.IS);
              this.state = 310;
              localctx._isOperatorId = this.isOperatorId();

              this.checkDataTypeForIsOperator(localctx._isOperatorId.getText());

              break;
          }
        }
        this.state = 317;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 25, this._ctx);
      }

    } catch (error) {
      if (error instanceof antlr4.error.RecognitionException) {
        localctx.exception = error;
        this._errHandler.reportError(this, error);
        this._errHandler.recover(this, error);
      } else {
        throw error;
      }
    } finally {
      this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
  }


  simpleExpression(_p) {
    if (_p === undefined) {
      _p = 0;
    }
    const _parentctx = this._ctx;
    const _parentState = this.state;
    let localctx = new SimpleExpressionContext(this, this._ctx, _parentState);
    let _prevctx = localctx;
    const _startState = 34;
    this.enterRecursionRule(
        localctx, 34, FirebaseRulesParser.RULE_simpleExpression, _p);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 348;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 29, this._ctx);
      switch (la_) {
        case 1:
          localctx = new PathSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;

          this.state = 319;
          this.pathExpression();
          break;

        case 2:
          localctx = new ListSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 320;
          this.match(FirebaseRulesParser.LBRACKET);
          this.state = 322;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((((_la - 6)) & ~0x1f) === 0 &&
               ((1 << (_la - 6)) & 138449857) !== 0) ||
              ((((_la - 40)) & ~0x1f) === 0 &&
               ((1 << (_la - 40)) & 4278190113) !== 0)) {
            this.state = 321;
            this.expressionList();
          }

          this.state = 324;
          this.match(FirebaseRulesParser.RBRACKET);
          break;

        case 3:
          localctx = new MapSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 325;
          this.mapExpression();
          break;

        case 4:
          localctx =
              new IdMemberFunctionCallSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 326;
          this.id();
          this.state = 327;
          this.match(FirebaseRulesParser.DOT);
          this.state = 328;
          this.memberId();
          this.state = 329;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 331;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((((_la - 6)) & ~0x1f) === 0 &&
               ((1 << (_la - 6)) & 138449857) !== 0) ||
              ((((_la - 40)) & ~0x1f) === 0 &&
               ((1 << (_la - 40)) & 4278190113) !== 0)) {
            this.state = 330;
            this.expressionList();
          }

          this.state = 333;
          this.match(FirebaseRulesParser.RPAREN);
          break;

        case 5:
          localctx = new ParenSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 335;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 336;
          this.expression(0);
          this.state = 337;
          this.match(FirebaseRulesParser.RPAREN);
          break;

        case 6:
          localctx = new FunctionCallSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 339;
          this.localFunctionId();
          this.state = 340;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 342;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((((_la - 6)) & ~0x1f) === 0 &&
               ((1 << (_la - 6)) & 138449857) !== 0) ||
              ((((_la - 40)) & ~0x1f) === 0 &&
               ((1 << (_la - 40)) & 4278190113) !== 0)) {
            this.state = 341;
            this.expressionList();
          }

          this.state = 344;
          this.match(FirebaseRulesParser.RPAREN);
          break;

        case 7:
          localctx = new VariableSimpleExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 346;
          this.localVariableId();
          break;

        case 8:
          localctx = new LiteralExpressionContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 347;
          this.literal();
          break;
      }
      this._ctx.stop = this._input.LT(-1);
      this.state = 369;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 32, this._ctx)
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          if (this._parseListeners !== null) {
            this.triggerExitRuleEvent();
          }
          _prevctx = localctx;
          this.state = 367;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 31, this._ctx);
          switch (la_) {
            case 1:
              localctx = new MemberFunctionCallSimpleExpressionContext(
                  this,
                  new SimpleExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState,
                  FirebaseRulesParser.RULE_simpleExpression);
              this.state = 350;
              if (!(this.precpred(this._ctx, 7))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 7)');
              }
              this.state = 351;
              this.match(FirebaseRulesParser.DOT);
              this.state = 352;
              this.memberId();
              this.state = 353;
              this.match(FirebaseRulesParser.LPAREN);
              this.state = 355;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
              if (((((_la - 6)) & ~0x1f) === 0 &&
                   ((1 << (_la - 6)) & 138449857) !== 0) ||
                  ((((_la - 40)) & ~0x1f) === 0 &&
                   ((1 << (_la - 40)) & 4278190113) !== 0)) {
                this.state = 354;
                this.expressionList();
              }

              this.state = 357;
              this.match(FirebaseRulesParser.RPAREN);
              break;

            case 2:
              localctx = new MemberLookupSimpleExpressionContext(
                  this,
                  new SimpleExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState,
                  FirebaseRulesParser.RULE_simpleExpression);
              this.state = 359;
              if (!(this.precpred(this._ctx, 5))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 5)');
              }
              this.state = 360;
              this.match(FirebaseRulesParser.DOT);
              this.state = 361;
              this.keywordId();
              break;

            case 3:
              localctx = new ListLookupSimpleExpressionContext(
                  this,
                  new SimpleExpressionContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(
                  localctx, _startState,
                  FirebaseRulesParser.RULE_simpleExpression);
              this.state = 362;
              if (!(this.precpred(this._ctx, 4))) {
                throw new antlr4.error.FailedPredicateException(
                    this, 'this.precpred(this._ctx, 4)');
              }
              this.state = 363;
              this.match(FirebaseRulesParser.LBRACKET);
              this.state = 364;
              this.listIndex();
              this.state = 365;
              this.match(FirebaseRulesParser.RBRACKET);
              break;
          }
        }
        this.state = 371;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 32, this._ctx);
      }

    } catch (error) {
      if (error instanceof antlr4.error.RecognitionException) {
        localctx.exception = error;
        this._errHandler.reportError(this, error);
        this._errHandler.recover(this, error);
      } else {
        throw error;
      }
    } finally {
      this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
  }



  pathExpression() {
    let localctx = new PathExpressionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 36, FirebaseRulesParser.RULE_pathExpression);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 373;
      this._errHandler.sync(this);
      var _alt = 1;
      do {
        switch (_alt) {
          case 1:
            this.state = 372;
            this.pathExpressionSegment();
            break;
          default:
            throw new antlr4.error.NoViableAltException(this);
        }
        this.state = 375;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 33, this._ctx);
      } while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  pathExpressionSegment() {
    let localctx =
        new PathExpressionSegmentContext(this, this._ctx, this.state);
    this.enterRule(
        localctx, 38, FirebaseRulesParser.RULE_pathExpressionSegment);
    try {
      this.state = 384;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 34, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 377;
          this.pathDeclSegment();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 378;
          this.match(FirebaseRulesParser.SLASH);
          this.state = 379;
          this.match(FirebaseRulesParser.DOLLAR);
          this.state = 380;
          this.match(FirebaseRulesParser.LPAREN);
          this.state = 381;
          this.expression(0);
          this.state = 382;
          this.match(FirebaseRulesParser.RPAREN);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  listIndex() {
    let localctx = new ListIndexContext(this, this._ctx, this.state);
    this.enterRule(localctx, 40, FirebaseRulesParser.RULE_listIndex);
    var _la = 0;
    try {
      this.state = 394;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 37, this._ctx);
      switch (la_) {
        case 1:
          localctx = new RangeLookupContext(this, localctx);
          this.enterOuterAlt(localctx, 1);
          this.state = 387;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((((_la - 6)) & ~0x1f) === 0 &&
               ((1 << (_la - 6)) & 138449857) !== 0) ||
              ((((_la - 40)) & ~0x1f) === 0 &&
               ((1 << (_la - 40)) & 4278190113) !== 0)) {
            this.state = 386;
            localctx.expr1 = this.expression(0);
          }

          this.state = 389;
          localctx.op = this.match(FirebaseRulesParser.COLON);
          this.state = 391;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((((_la - 6)) & ~0x1f) === 0 &&
               ((1 << (_la - 6)) & 138449857) !== 0) ||
              ((((_la - 40)) & ~0x1f) === 0 &&
               ((1 << (_la - 40)) & 4278190113) !== 0)) {
            this.state = 390;
            localctx.expr2 = this.expression(0);
          }

          break;

        case 2:
          localctx = new IndexLookupContext(this, localctx);
          this.enterOuterAlt(localctx, 2);
          this.state = 393;
          this.expression(0);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  mapExpression() {
    let localctx = new MapExpressionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 42, FirebaseRulesParser.RULE_mapExpression);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 396;
      this.match(FirebaseRulesParser.LBRACE);
      this.state = 398;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (((((_la - 6)) & ~0x1f) === 0 &&
           ((1 << (_la - 6)) & 138449857) !== 0) ||
          ((((_la - 40)) & ~0x1f) === 0 &&
           ((1 << (_la - 40)) & 4278190113) !== 0)) {
        this.state = 397;
        this.mapEntries();
      }

      this.state = 400;
      this.match(FirebaseRulesParser.RBRACE);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  mapEntries() {
    let localctx = new MapEntriesContext(this, this._ctx, this.state);
    this.enterRule(localctx, 44, FirebaseRulesParser.RULE_mapEntries);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 402;
      this.mapEntry();
      this.state = 407;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 39, this._ctx)
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          this.state = 403;
          this.match(FirebaseRulesParser.COMMA);
          this.state = 404;
          this.mapEntry();
        }
        this.state = 409;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 39, this._ctx);
      }

      this.state = 411;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 5) {
        this.state = 410;
        this.match(FirebaseRulesParser.COMMA);
      }

    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  mapEntry() {
    let localctx = new MapEntryContext(this, this._ctx, this.state);
    this.enterRule(localctx, 46, FirebaseRulesParser.RULE_mapEntry);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 413;
      this.expression(0);
      this.state = 414;
      this.match(FirebaseRulesParser.COLON);
      this.state = 415;
      this.expression(0);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  expressionList() {
    let localctx = new ExpressionListContext(this, this._ctx, this.state);
    this.enterRule(localctx, 48, FirebaseRulesParser.RULE_expressionList);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 417;
      this.expression(0);
      this.state = 422;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 41, this._ctx)
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          this.state = 418;
          this.match(FirebaseRulesParser.COMMA);
          this.state = 419;
          this.expression(0);
        }
        this.state = 424;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 41, this._ctx);
      }

      this.state = 426;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 5) {
        this.state = 425;
        this.match(FirebaseRulesParser.COMMA);
      }

    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  literal() {
    let localctx = new LiteralContext(this, this._ctx, this.state);
    this.enterRule(localctx, 50, FirebaseRulesParser.RULE_literal);
    try {
      this.state = 439;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 67:
          this.enterOuterAlt(localctx, 1);
          this.state = 428;
          this.match(FirebaseRulesParser.NUM_FLOAT);
          break;
        case 66:
          this.enterOuterAlt(localctx, 2);
          this.state = 429;
          this.match(FirebaseRulesParser.NUM_INT);
          break;
        case 70:
          this.enterOuterAlt(localctx, 3);
          this.state = 430;
          this.match(FirebaseRulesParser.STRING);
          break;
        case 71:
          this.enterOuterAlt(localctx, 4);
          this.state = 431;
          this.match(FirebaseRulesParser.BYTES);
          break;
        case 45:
          this.enterOuterAlt(localctx, 5);
          this.state = 432;
          this.match(FirebaseRulesParser.TRUE);
          break;
        case 33:
          this.enterOuterAlt(localctx, 6);
          this.state = 433;
          this.match(FirebaseRulesParser.FALSE);
          break;
        case 40:
          this.enterOuterAlt(localctx, 7);
          this.state = 434;
          this.match(FirebaseRulesParser.NULL);
          break;
        case 69:
          this.enterOuterAlt(localctx, 8);
          this.state = 435;
          this.match(FirebaseRulesParser.UNPAIRED_SINGLE_QUOTE);

          this.notifyErrorListeners('Missing a closing \'');

          break;
        case 68:
          this.enterOuterAlt(localctx, 9);
          this.state = 437;
          this.match(FirebaseRulesParser.UNPAIRED_DOUBLE_QUOTE);

          this.notifyErrorListeners('Missing a closing "');

          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  keywordId() {
    let localctx = new KeywordIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 52, FirebaseRulesParser.RULE_keywordId);
    try {
      this.state = 443;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 65:
          this.enterOuterAlt(localctx, 1);
          this.state = 441;
          this.match(FirebaseRulesParser.IDENTIFIER);
          break;
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38:
        case 39:
        case 40:
        case 41:
        case 42:
        case 43:
        case 45:
        case 46:
        case 47:
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 58:
        case 59:
        case 60:
        case 61:
        case 62:
        case 63:
          this.enterOuterAlt(localctx, 2);
          this.state = 442;
          this.keyword();
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  keyword() {
    let localctx = new KeywordContext(this, this._ctx, this.state);
    this.enterRule(localctx, 54, FirebaseRulesParser.RULE_keyword);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 445;
      _la = this._input.LA(1);
      if (!(((((_la - 32)) & ~0x1f) === 0 &&
             ((1 << (_la - 32)) & 4294963199) !== 0))) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  pathDecl() {
    let localctx = new PathDeclContext(this, this._ctx, this.state);
    this.enterRule(localctx, 56, FirebaseRulesParser.RULE_pathDecl);
    var _la = 0;
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 448;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      do {
        this.state = 447;
        this.pathDeclSegment();
        this.state = 450;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      } while (_la === 28 || _la === 64);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  pathDeclSegment() {
    let localctx = new PathDeclSegmentContext(this, this._ctx, this.state);
    this.enterRule(localctx, 58, FirebaseRulesParser.RULE_pathDeclSegment);
    try {
      this.state = 459;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 46, this._ctx);
      switch (la_) {
        case 1:
          localctx = new SimpleSegmemntContext(this, localctx);
          this.enterOuterAlt(localctx, 1);
          this.state = 452;
          this.match(FirebaseRulesParser.PATH_SEGMENT);
          break;

        case 2:
          localctx = new CaptureSegmentContext(this, localctx);
          this.enterOuterAlt(localctx, 2);
          this.state = 453;
          this.match(FirebaseRulesParser.SLASH);
          this.state = 454;
          this.capture();
          break;

        case 3:
          localctx = new GlobSegmentContext(this, localctx);
          this.enterOuterAlt(localctx, 3);
          this.state = 455;
          this.match(FirebaseRulesParser.SLASH);
          this.state = 456;
          this.globCapture();
          break;

        case 4:
          localctx = new EmptySegmentContext(this, localctx);
          this.enterOuterAlt(localctx, 4);

          this.notifyErrorListeners(
              'Forward slash \'/\' found where identifier or binding expected.');

          this.state = 458;
          this.match(FirebaseRulesParser.SLASH);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  globCapture() {
    let localctx = new GlobCaptureContext(this, this._ctx, this.state);
    this.enterRule(localctx, 60, FirebaseRulesParser.RULE_globCapture);
    try {
      this.state = 475;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 47, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 461;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 462;
          this.localVariableId();
          this.state = 463;
          this.match(FirebaseRulesParser.ASSIGNMENT);
          this.state = 464;
          this.match(FirebaseRulesParser.GLOB);
          this.state = 465;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 467;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 468;
          this.localVariableId();
          this.state = 469;
          this.match(FirebaseRulesParser.ASSIGNMENT);
          this.state = 470;
          this.match(FirebaseRulesParser.GLOB);
          this.state = 471;
          this.match(FirebaseRulesParser.RBRACE);

          this.notifyErrorListeners('Exra closing \'}\' in path.');

          this.state = 473;
          this.match(FirebaseRulesParser.RBRACE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  capture() {
    let localctx = new CaptureContext(this, this._ctx, this.state);
    this.enterRule(localctx, 62, FirebaseRulesParser.RULE_capture);
    try {
      this.state = 501;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 48, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 477;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 478;
          this.localVariableId();
          this.state = 479;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 481;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 482;
          this.localVariableId();
          this.state = 483;
          this.match(FirebaseRulesParser.ASSIGNMENT);
          this.state = 484;
          this.match(FirebaseRulesParser.STAR);
          this.state = 485;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 487;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 488;
          this.localVariableId();
          this.state = 489;
          this.match(FirebaseRulesParser.RBRACE);

          this.notifyErrorListeners('Extra closing \'}\' in path.');

          this.state = 491;
          this.match(FirebaseRulesParser.RBRACE);
          break;

        case 4:
          this.enterOuterAlt(localctx, 4);
          this.state = 493;
          this.match(FirebaseRulesParser.LBRACE);
          this.state = 494;
          this.localVariableId();
          this.state = 495;
          this.match(FirebaseRulesParser.ASSIGNMENT);
          this.state = 496;
          this.match(FirebaseRulesParser.STAR);
          this.state = 497;
          this.match(FirebaseRulesParser.RBRACE);

          this.notifyErrorListeners('Extra closing \'}\' in path.');

          this.state = 499;
          this.match(FirebaseRulesParser.RBRACE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  id() {
    let localctx = new IdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 64, FirebaseRulesParser.RULE_id);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 503;
      this.match(FirebaseRulesParser.IDENTIFIER);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  serviceId() {
    let localctx = new ServiceIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 66, FirebaseRulesParser.RULE_serviceId);
    try {
      this.state = 508;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 76:
          this.enterOuterAlt(localctx, 1);

          this.notifyErrorListeners('Cannot use keyword as service name.');

          this.state = 506;
          this.match(FirebaseRulesParser.BAD_KEYWORD);
          break;
        case 77:
          this.enterOuterAlt(localctx, 2);
          this.state = 507;
          this.match(FirebaseRulesParser.SERVICE_IDENTIFIER);
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  isOperatorId() {
    let localctx = new IsOperatorIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 68, FirebaseRulesParser.RULE_isOperatorId);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 510;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  operationId() {
    let localctx = new OperationIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 70, FirebaseRulesParser.RULE_operationId);
    var _la = 0;
    try {
      this.state = 531;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 52, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 512;
          this.id();
          this.state = 517;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          while (_la === 5) {
            this.state = 513;
            this.match(FirebaseRulesParser.COMMA);
            this.state = 514;
            this.id();
            this.state = 519;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          }
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 520;
          this.id();
          this.state = 525;
          this._errHandler.sync(this);
          var _alt = this._interp.adaptivePredict(this._input, 51, this._ctx)
          while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if (_alt === 1) {
              this.state = 521;
              this.match(FirebaseRulesParser.COMMA);
              this.state = 522;
              this.id();
            }
            this.state = 527;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input, 51, this._ctx);
          }


          this.notifyErrorListeners('Unexpected \',\'.');

          this.state = 529;
          this.match(FirebaseRulesParser.COMMA);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  packageId() {
    let localctx = new PackageIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 72, FirebaseRulesParser.RULE_packageId);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 533;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  memberId() {
    let localctx = new MemberIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 74, FirebaseRulesParser.RULE_memberId);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 535;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  as() {
    let localctx = new AsContext(this, this._ctx, this.state);
    this.enterRule(localctx, 76, FirebaseRulesParser.RULE_as);
    try {
      this.enterOuterAlt(localctx, 1);

      if (!getCurrentToken().getText().equals('as')) {
        this.notifyErrorListeners(
            'Import statement with alias must use the format \'as <alias>\'');
      }

      this.state = 538;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  localVariableId() {
    let localctx = new LocalVariableIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 78, FirebaseRulesParser.RULE_localVariableId);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 540;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }



  localFunctionId() {
    let localctx = new LocalFunctionIdContext(this, this._ctx, this.state);
    this.enterRule(localctx, 80, FirebaseRulesParser.RULE_localFunctionId);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 542;
      this.id();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
}

FirebaseRulesParser.EOF = antlr4.Token.EOF;
FirebaseRulesParser.AND = 1;
FirebaseRulesParser.ASSIGNMENT = 2;
FirebaseRulesParser.AT = 3;
FirebaseRulesParser.COLON = 4;
FirebaseRulesParser.COMMA = 5;
FirebaseRulesParser.DECREMENT = 6;
FirebaseRulesParser.DOLLAR = 7;
FirebaseRulesParser.DOT = 8;
FirebaseRulesParser.EQ = 9;
FirebaseRulesParser.GT = 10;
FirebaseRulesParser.GTE = 11;
FirebaseRulesParser.INCREMENT = 12;
FirebaseRulesParser.LBRACE = 13;
FirebaseRulesParser.LBRACKET = 14;
FirebaseRulesParser.LPAREN = 15;
FirebaseRulesParser.LT = 16;
FirebaseRulesParser.LTE = 17;
FirebaseRulesParser.MINUS = 18;
FirebaseRulesParser.MOD = 19;
FirebaseRulesParser.NEQ = 20;
FirebaseRulesParser.NOT = 21;
FirebaseRulesParser.OR = 22;
FirebaseRulesParser.PLUS = 23;
FirebaseRulesParser.RBRACE = 24;
FirebaseRulesParser.RBRACKET = 25;
FirebaseRulesParser.RPAREN = 26;
FirebaseRulesParser.SEMI = 27;
FirebaseRulesParser.SLASH = 28;
FirebaseRulesParser.STAR = 29;
FirebaseRulesParser.GLOB = 30;
FirebaseRulesParser.QUESTION = 31;
FirebaseRulesParser.ALLOW = 32;
FirebaseRulesParser.FALSE = 33;
FirebaseRulesParser.FUNCTION = 34;
FirebaseRulesParser.IF = 35;
FirebaseRulesParser.IMPORT = 36;
FirebaseRulesParser.IN = 37;
FirebaseRulesParser.IS = 38;
FirebaseRulesParser.LET = 39;
FirebaseRulesParser.NULL = 40;
FirebaseRulesParser.RETURN = 41;
FirebaseRulesParser.SERVICE = 42;
FirebaseRulesParser.MATCH = 43;
FirebaseRulesParser.RULES_VERSION = 44;
FirebaseRulesParser.TRUE = 45;
FirebaseRulesParser.ARGUMENTS = 46;
FirebaseRulesParser.BREAK = 47;
FirebaseRulesParser.CASE = 48;
FirebaseRulesParser.CONTINUE = 49;
FirebaseRulesParser.DEFAULT = 50;
FirebaseRulesParser.DENY = 51;
FirebaseRulesParser.DO = 52;
FirebaseRulesParser.EACH = 53;
FirebaseRulesParser.ELSE = 54;
FirebaseRulesParser.EXTENDS = 55;
FirebaseRulesParser.FOR = 56;
FirebaseRulesParser.GOTO = 57;
FirebaseRulesParser.NOT_TEXT = 58;
FirebaseRulesParser.PACKAGE = 59;
FirebaseRulesParser.SWITCH = 60;
FirebaseRulesParser.THEN = 61;
FirebaseRulesParser.VAR = 62;
FirebaseRulesParser.WHILE = 63;
FirebaseRulesParser.PATH_SEGMENT = 64;
FirebaseRulesParser.IDENTIFIER = 65;
FirebaseRulesParser.NUM_INT = 66;
FirebaseRulesParser.NUM_FLOAT = 67;
FirebaseRulesParser.UNPAIRED_DOUBLE_QUOTE = 68;
FirebaseRulesParser.UNPAIRED_SINGLE_QUOTE = 69;
FirebaseRulesParser.STRING = 70;
FirebaseRulesParser.BYTES = 71;
FirebaseRulesParser.LINE_COMMENT = 72;
FirebaseRulesParser.BLOCK_COMMENT = 73;
FirebaseRulesParser.WHITE_SPACE = 74;
FirebaseRulesParser.UNKNOWN = 75;
FirebaseRulesParser.BAD_KEYWORD = 76;
FirebaseRulesParser.SERVICE_IDENTIFIER = 77;
FirebaseRulesParser.HIDE_SPACE = 78;

FirebaseRulesParser.RULE_ruleset = 0;
FirebaseRulesParser.RULE_versionStatement = 1;
FirebaseRulesParser.RULE_importStatement = 2;
FirebaseRulesParser.RULE_rulesetStatement = 3;
FirebaseRulesParser.RULE_serviceDeclaration = 4;
FirebaseRulesParser.RULE_serviceStatement = 5;
FirebaseRulesParser.RULE_functionDeclaration = 6;
FirebaseRulesParser.RULE_bindingDeclaration = 7;
FirebaseRulesParser.RULE_functionSignature = 8;
FirebaseRulesParser.RULE_paramList = 9;
FirebaseRulesParser.RULE_functionBody = 10;
FirebaseRulesParser.RULE_returnStatement = 11;
FirebaseRulesParser.RULE_matchRuleDeclaration = 12;
FirebaseRulesParser.RULE_matchStatement = 13;
FirebaseRulesParser.RULE_permissionDeclaration = 14;
FirebaseRulesParser.RULE_permissionBody = 15;
FirebaseRulesParser.RULE_expression = 16;
FirebaseRulesParser.RULE_simpleExpression = 17;
FirebaseRulesParser.RULE_pathExpression = 18;
FirebaseRulesParser.RULE_pathExpressionSegment = 19;
FirebaseRulesParser.RULE_listIndex = 20;
FirebaseRulesParser.RULE_mapExpression = 21;
FirebaseRulesParser.RULE_mapEntries = 22;
FirebaseRulesParser.RULE_mapEntry = 23;
FirebaseRulesParser.RULE_expressionList = 24;
FirebaseRulesParser.RULE_literal = 25;
FirebaseRulesParser.RULE_keywordId = 26;
FirebaseRulesParser.RULE_keyword = 27;
FirebaseRulesParser.RULE_pathDecl = 28;
FirebaseRulesParser.RULE_pathDeclSegment = 29;
FirebaseRulesParser.RULE_globCapture = 30;
FirebaseRulesParser.RULE_capture = 31;
FirebaseRulesParser.RULE_id = 32;
FirebaseRulesParser.RULE_serviceId = 33;
FirebaseRulesParser.RULE_isOperatorId = 34;
FirebaseRulesParser.RULE_operationId = 35;
FirebaseRulesParser.RULE_packageId = 36;
FirebaseRulesParser.RULE_memberId = 37;
FirebaseRulesParser.RULE_as = 38;
FirebaseRulesParser.RULE_localVariableId = 39;
FirebaseRulesParser.RULE_localFunctionId = 40;

class RulesetContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_ruleset;
  }

  EOF() {
    return this.getToken(FirebaseRulesParser.EOF, 0);
  };

  versionStatement() {
    return this.getTypedRuleContext(VersionStatementContext, 0);
  };

  importStatement = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ImportStatementContext);
    } else {
      return this.getTypedRuleContext(ImportStatementContext, i);
    }
  };

  rulesetStatement = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(RulesetStatementContext);
    } else {
      return this.getTypedRuleContext(RulesetStatementContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterRuleset(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitRuleset(this);
    }
  }
}



class VersionStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_versionStatement;
  }

  RULES_VERSION() {
    return this.getToken(FirebaseRulesParser.RULES_VERSION, 0);
  };

  ASSIGNMENT() {
    return this.getToken(FirebaseRulesParser.ASSIGNMENT, 0);
  };

  STRING() {
    return this.getToken(FirebaseRulesParser.STRING, 0);
  };

  SEMI() {
    return this.getToken(FirebaseRulesParser.SEMI, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterVersionStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitVersionStatement(this);
    }
  }
}



class ImportStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_importStatement;
  }

  IMPORT() {
    return this.getToken(FirebaseRulesParser.IMPORT, 0);
  };

  STRING() {
    return this.getToken(FirebaseRulesParser.STRING, 0);
  };

  SEMI() {
    return this.getToken(FirebaseRulesParser.SEMI, 0);
  };

  as() {
    return this.getTypedRuleContext(AsContext, 0);
  };

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterImportStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitImportStatement(this);
    }
  }
}



class RulesetStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_rulesetStatement;
  }

  functionDeclaration() {
    return this.getTypedRuleContext(FunctionDeclarationContext, 0);
  };

  serviceDeclaration() {
    return this.getTypedRuleContext(ServiceDeclarationContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterRulesetStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitRulesetStatement(this);
    }
  }
}



class ServiceDeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_serviceDeclaration;
  }

  SERVICE() {
    return this.getToken(FirebaseRulesParser.SERVICE, 0);
  };

  serviceId() {
    return this.getTypedRuleContext(ServiceIdContext, 0);
  };

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  RBRACE() {
    return this.getToken(FirebaseRulesParser.RBRACE, 0);
  };

  serviceStatement = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ServiceStatementContext);
    } else {
      return this.getTypedRuleContext(ServiceStatementContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterServiceDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitServiceDeclaration(this);
    }
  }
}



class ServiceStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_serviceStatement;
  }

  functionDeclaration() {
    return this.getTypedRuleContext(FunctionDeclarationContext, 0);
  };

  matchRuleDeclaration() {
    return this.getTypedRuleContext(MatchRuleDeclarationContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterServiceStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitServiceStatement(this);
    }
  }
}



class FunctionDeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_functionDeclaration;
  }

  FUNCTION() {
    return this.getToken(FirebaseRulesParser.FUNCTION, 0);
  };

  localFunctionId() {
    return this.getTypedRuleContext(LocalFunctionIdContext, 0);
  };

  functionSignature() {
    return this.getTypedRuleContext(FunctionSignatureContext, 0);
  };

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  functionBody() {
    return this.getTypedRuleContext(FunctionBodyContext, 0);
  };

  RBRACE() {
    return this.getToken(FirebaseRulesParser.RBRACE, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterFunctionDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitFunctionDeclaration(this);
    }
  }
}



class BindingDeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_bindingDeclaration;
  }

  LET() {
    return this.getToken(FirebaseRulesParser.LET, 0);
  };

  localVariableId() {
    return this.getTypedRuleContext(LocalVariableIdContext, 0);
  };

  ASSIGNMENT() {
    return this.getToken(FirebaseRulesParser.ASSIGNMENT, 0);
  };

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  SEMI() {
    return this.getToken(FirebaseRulesParser.SEMI, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterBindingDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitBindingDeclaration(this);
    }
  }
}



class FunctionSignatureContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_functionSignature;
  }

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  RPAREN = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.RPAREN);
    } else {
      return this.getToken(FirebaseRulesParser.RPAREN, i);
    }
  };


  paramList() {
    return this.getTypedRuleContext(ParamListContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterFunctionSignature(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitFunctionSignature(this);
    }
  }
}



class ParamListContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_paramList;
  }

  localVariableId = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(LocalVariableIdContext);
    } else {
      return this.getTypedRuleContext(LocalVariableIdContext, i);
    }
  };

  COMMA = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.COMMA);
    } else {
      return this.getToken(FirebaseRulesParser.COMMA, i);
    }
  };


  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterParamList(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitParamList(this);
    }
  }
}



class FunctionBodyContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_functionBody;
  }

  returnStatement() {
    return this.getTypedRuleContext(ReturnStatementContext, 0);
  };

  bindingDeclaration = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(BindingDeclarationContext);
    } else {
      return this.getTypedRuleContext(BindingDeclarationContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterFunctionBody(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitFunctionBody(this);
    }
  }
}



class ReturnStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_returnStatement;
  }

  RETURN() {
    return this.getToken(FirebaseRulesParser.RETURN, 0);
  };

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  SEMI() {
    return this.getToken(FirebaseRulesParser.SEMI, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterReturnStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitReturnStatement(this);
    }
  }
}



class MatchRuleDeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_matchRuleDeclaration;
  }

  MATCH() {
    return this.getToken(FirebaseRulesParser.MATCH, 0);
  };

  pathDecl() {
    return this.getTypedRuleContext(PathDeclContext, 0);
  };

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  RBRACE() {
    return this.getToken(FirebaseRulesParser.RBRACE, 0);
  };

  matchStatement = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(MatchStatementContext);
    } else {
      return this.getTypedRuleContext(MatchStatementContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMatchRuleDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMatchRuleDeclaration(this);
    }
  }
}



class MatchStatementContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_matchStatement;
  }

  functionDeclaration() {
    return this.getTypedRuleContext(FunctionDeclarationContext, 0);
  };

  permissionDeclaration() {
    return this.getTypedRuleContext(PermissionDeclarationContext, 0);
  };

  matchRuleDeclaration() {
    return this.getTypedRuleContext(MatchRuleDeclarationContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMatchStatement(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMatchStatement(this);
    }
  }
}



class PermissionDeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_permissionDeclaration;
  }

  ALLOW() {
    return this.getToken(FirebaseRulesParser.ALLOW, 0);
  };

  operationId() {
    return this.getTypedRuleContext(OperationIdContext, 0);
  };

  permissionBody() {
    return this.getTypedRuleContext(PermissionBodyContext, 0);
  };

  SEMI() {
    return this.getToken(FirebaseRulesParser.SEMI, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPermissionDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPermissionDeclaration(this);
    }
  }
}



class PermissionBodyContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_permissionBody;
  }

  COLON() {
    return this.getToken(FirebaseRulesParser.COLON, 0);
  };

  IF() {
    return this.getToken(FirebaseRulesParser.IF, 0);
  };

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPermissionBody(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPermissionBody(this);
    }
  }
}



class ExpressionContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_expression;
  }



  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}


class AdditiveExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  PLUS() {
    return this.getToken(FirebaseRulesParser.PLUS, 0);
  };

  MINUS() {
    return this.getToken(FirebaseRulesParser.MINUS, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterAdditiveExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitAdditiveExpression(this);
    }
  }
}

FirebaseRulesParser.AdditiveExpressionContext = AdditiveExpressionContext;

class RelationalExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  GT() {
    return this.getToken(FirebaseRulesParser.GT, 0);
  };

  GTE() {
    return this.getToken(FirebaseRulesParser.GTE, 0);
  };

  LT() {
    return this.getToken(FirebaseRulesParser.LT, 0);
  };

  LTE() {
    return this.getToken(FirebaseRulesParser.LTE, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterRelationalExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitRelationalExpression(this);
    }
  }
}

FirebaseRulesParser.RelationalExpressionContext = RelationalExpressionContext;

class TernaryExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  COLON() {
    return this.getToken(FirebaseRulesParser.COLON, 0);
  };

  QUESTION() {
    return this.getToken(FirebaseRulesParser.QUESTION, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterTernaryExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitTernaryExpression(this);
    }
  }
}

FirebaseRulesParser.TernaryExpressionContext = TernaryExpressionContext;

class LogicalAndExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  AND() {
    return this.getToken(FirebaseRulesParser.AND, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLogicalAndExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLogicalAndExpression(this);
    }
  }
}

FirebaseRulesParser.LogicalAndExpressionContext = LogicalAndExpressionContext;

class PrimaryExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPrimaryExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPrimaryExpression(this);
    }
  }
}

FirebaseRulesParser.PrimaryExpressionContext = PrimaryExpressionContext;

class LogicalOrExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  OR() {
    return this.getToken(FirebaseRulesParser.OR, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLogicalOrExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLogicalOrExpression(this);
    }
  }
}

FirebaseRulesParser.LogicalOrExpressionContext = LogicalOrExpressionContext;

class ExprIsTypeIdExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    this._isOperatorId = null;
    ;
    super.copyFrom(ctx);
  }

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  isOperatorId() {
    return this.getTypedRuleContext(IsOperatorIdContext, 0);
  };

  IS() {
    return this.getToken(FirebaseRulesParser.IS, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterExprIsTypeIdExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitExprIsTypeIdExpression(this);
    }
  }
}

FirebaseRulesParser.ExprIsTypeIdExpressionContext =
    ExprIsTypeIdExpressionContext;

class NotExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  NOT() {
    return this.getToken(FirebaseRulesParser.NOT, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterNotExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitNotExpression(this);
    }
  }
}

FirebaseRulesParser.NotExpressionContext = NotExpressionContext;

class UnaryAdditiveExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  MINUS() {
    return this.getToken(FirebaseRulesParser.MINUS, 0);
  };

  INCREMENT() {
    return this.getToken(FirebaseRulesParser.INCREMENT, 0);
  };

  DECREMENT() {
    return this.getToken(FirebaseRulesParser.DECREMENT, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterUnaryAdditiveExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitUnaryAdditiveExpression(this);
    }
  }
}

FirebaseRulesParser.UnaryAdditiveExpressionContext =
    UnaryAdditiveExpressionContext;

class UnsupportedAdditivePostfixContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  INCREMENT() {
    return this.getToken(FirebaseRulesParser.INCREMENT, 0);
  };

  DECREMENT() {
    return this.getToken(FirebaseRulesParser.DECREMENT, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterUnsupportedAdditivePostfix(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitUnsupportedAdditivePostfix(this);
    }
  }
}

FirebaseRulesParser.UnsupportedAdditivePostfixContext =
    UnsupportedAdditivePostfixContext;

class ExprInExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  IN() {
    return this.getToken(FirebaseRulesParser.IN, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterExprInExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitExprInExpression(this);
    }
  }
}

FirebaseRulesParser.ExprInExpressionContext = ExprInExpressionContext;

class UnsupportedAdditivePrefixContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  INCREMENT() {
    return this.getToken(FirebaseRulesParser.INCREMENT, 0);
  };

  DECREMENT() {
    return this.getToken(FirebaseRulesParser.DECREMENT, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterUnsupportedAdditivePrefix(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitUnsupportedAdditivePrefix(this);
    }
  }
}

FirebaseRulesParser.UnsupportedAdditivePrefixContext =
    UnsupportedAdditivePrefixContext;

class EqualityExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  EQ() {
    return this.getToken(FirebaseRulesParser.EQ, 0);
  };

  NEQ() {
    return this.getToken(FirebaseRulesParser.NEQ, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterEqualityExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitEqualityExpression(this);
    }
  }
}

FirebaseRulesParser.EqualityExpressionContext = EqualityExpressionContext;

class MultiplicativeExpressionContext extends ExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null;
    ;
    super.copyFrom(ctx);
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  STAR() {
    return this.getToken(FirebaseRulesParser.STAR, 0);
  };

  SLASH() {
    return this.getToken(FirebaseRulesParser.SLASH, 0);
  };

  MOD() {
    return this.getToken(FirebaseRulesParser.MOD, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMultiplicativeExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMultiplicativeExpression(this);
    }
  }
}

FirebaseRulesParser.MultiplicativeExpressionContext =
    MultiplicativeExpressionContext;

class SimpleExpressionContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_simpleExpression;
  }



  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}


class MemberLookupSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  DOT() {
    return this.getToken(FirebaseRulesParser.DOT, 0);
  };

  keywordId() {
    return this.getTypedRuleContext(KeywordIdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMemberLookupSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMemberLookupSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.MemberLookupSimpleExpressionContext =
    MemberLookupSimpleExpressionContext;

class IdMemberFunctionCallSimpleExpressionContext extends
    SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  DOT() {
    return this.getToken(FirebaseRulesParser.DOT, 0);
  };

  memberId() {
    return this.getTypedRuleContext(MemberIdContext, 0);
  };

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  RPAREN() {
    return this.getToken(FirebaseRulesParser.RPAREN, 0);
  };

  expressionList() {
    return this.getTypedRuleContext(ExpressionListContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterIdMemberFunctionCallSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitIdMemberFunctionCallSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.IdMemberFunctionCallSimpleExpressionContext =
    IdMemberFunctionCallSimpleExpressionContext;

class LiteralExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  literal() {
    return this.getTypedRuleContext(LiteralContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLiteralExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLiteralExpression(this);
    }
  }
}

FirebaseRulesParser.LiteralExpressionContext = LiteralExpressionContext;

class ListLookupSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  LBRACKET() {
    return this.getToken(FirebaseRulesParser.LBRACKET, 0);
  };

  listIndex() {
    return this.getTypedRuleContext(ListIndexContext, 0);
  };

  RBRACKET() {
    return this.getToken(FirebaseRulesParser.RBRACKET, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterListLookupSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitListLookupSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.ListLookupSimpleExpressionContext =
    ListLookupSimpleExpressionContext;

class MapSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  mapExpression() {
    return this.getTypedRuleContext(MapExpressionContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMapSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMapSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.MapSimpleExpressionContext = MapSimpleExpressionContext;

class FunctionCallSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  localFunctionId() {
    return this.getTypedRuleContext(LocalFunctionIdContext, 0);
  };

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  RPAREN() {
    return this.getToken(FirebaseRulesParser.RPAREN, 0);
  };

  expressionList() {
    return this.getTypedRuleContext(ExpressionListContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterFunctionCallSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitFunctionCallSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.FunctionCallSimpleExpressionContext =
    FunctionCallSimpleExpressionContext;

class MemberFunctionCallSimpleExpressionContext extends
    SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  simpleExpression() {
    return this.getTypedRuleContext(SimpleExpressionContext, 0);
  };

  DOT() {
    return this.getToken(FirebaseRulesParser.DOT, 0);
  };

  memberId() {
    return this.getTypedRuleContext(MemberIdContext, 0);
  };

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  RPAREN() {
    return this.getToken(FirebaseRulesParser.RPAREN, 0);
  };

  expressionList() {
    return this.getTypedRuleContext(ExpressionListContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMemberFunctionCallSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMemberFunctionCallSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.MemberFunctionCallSimpleExpressionContext =
    MemberFunctionCallSimpleExpressionContext;

class ListSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  LBRACKET() {
    return this.getToken(FirebaseRulesParser.LBRACKET, 0);
  };

  RBRACKET() {
    return this.getToken(FirebaseRulesParser.RBRACKET, 0);
  };

  expressionList() {
    return this.getTypedRuleContext(ExpressionListContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterListSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitListSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.ListSimpleExpressionContext = ListSimpleExpressionContext;

class ParenSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  RPAREN() {
    return this.getToken(FirebaseRulesParser.RPAREN, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterParenSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitParenSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.ParenSimpleExpressionContext = ParenSimpleExpressionContext;

class PathSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  pathExpression() {
    return this.getTypedRuleContext(PathExpressionContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPathSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPathSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.PathSimpleExpressionContext = PathSimpleExpressionContext;

class VariableSimpleExpressionContext extends SimpleExpressionContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  localVariableId() {
    return this.getTypedRuleContext(LocalVariableIdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterVariableSimpleExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitVariableSimpleExpression(this);
    }
  }
}

FirebaseRulesParser.VariableSimpleExpressionContext =
    VariableSimpleExpressionContext;

class PathExpressionContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_pathExpression;
  }

  pathExpressionSegment = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(PathExpressionSegmentContext);
    } else {
      return this.getTypedRuleContext(PathExpressionSegmentContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPathExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPathExpression(this);
    }
  }
}



class PathExpressionSegmentContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_pathExpressionSegment;
  }

  pathDeclSegment() {
    return this.getTypedRuleContext(PathDeclSegmentContext, 0);
  };

  SLASH() {
    return this.getToken(FirebaseRulesParser.SLASH, 0);
  };

  DOLLAR() {
    return this.getToken(FirebaseRulesParser.DOLLAR, 0);
  };

  LPAREN() {
    return this.getToken(FirebaseRulesParser.LPAREN, 0);
  };

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  RPAREN() {
    return this.getToken(FirebaseRulesParser.RPAREN, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPathExpressionSegment(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPathExpressionSegment(this);
    }
  }
}



class ListIndexContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_listIndex;
  }



  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}


class IndexLookupContext extends ListIndexContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  expression() {
    return this.getTypedRuleContext(ExpressionContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterIndexLookup(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitIndexLookup(this);
    }
  }
}

FirebaseRulesParser.IndexLookupContext = IndexLookupContext;

class RangeLookupContext extends ListIndexContext {
  constructor(parser, ctx) {
    super(parser);
    this.expr1 = null;
    ;
    this.op = null;
    ;
    this.expr2 = null;
    ;
    super.copyFrom(ctx);
  }

  COLON() {
    return this.getToken(FirebaseRulesParser.COLON, 0);
  };

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterRangeLookup(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitRangeLookup(this);
    }
  }
}

FirebaseRulesParser.RangeLookupContext = RangeLookupContext;

class MapExpressionContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_mapExpression;
  }

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  RBRACE() {
    return this.getToken(FirebaseRulesParser.RBRACE, 0);
  };

  mapEntries() {
    return this.getTypedRuleContext(MapEntriesContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMapExpression(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMapExpression(this);
    }
  }
}



class MapEntriesContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_mapEntries;
  }

  mapEntry = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(MapEntryContext);
    } else {
      return this.getTypedRuleContext(MapEntryContext, i);
    }
  };

  COMMA = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.COMMA);
    } else {
      return this.getToken(FirebaseRulesParser.COMMA, i);
    }
  };


  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMapEntries(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMapEntries(this);
    }
  }
}



class MapEntryContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_mapEntry;
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  COLON() {
    return this.getToken(FirebaseRulesParser.COLON, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMapEntry(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMapEntry(this);
    }
  }
}



class ExpressionListContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_expressionList;
  }

  expression = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExpressionContext);
    } else {
      return this.getTypedRuleContext(ExpressionContext, i);
    }
  };

  COMMA = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.COMMA);
    } else {
      return this.getToken(FirebaseRulesParser.COMMA, i);
    }
  };


  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterExpressionList(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitExpressionList(this);
    }
  }
}



class LiteralContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_literal;
  }

  NUM_FLOAT() {
    return this.getToken(FirebaseRulesParser.NUM_FLOAT, 0);
  };

  NUM_INT() {
    return this.getToken(FirebaseRulesParser.NUM_INT, 0);
  };

  STRING() {
    return this.getToken(FirebaseRulesParser.STRING, 0);
  };

  BYTES() {
    return this.getToken(FirebaseRulesParser.BYTES, 0);
  };

  TRUE() {
    return this.getToken(FirebaseRulesParser.TRUE, 0);
  };

  FALSE() {
    return this.getToken(FirebaseRulesParser.FALSE, 0);
  };

  NULL() {
    return this.getToken(FirebaseRulesParser.NULL, 0);
  };

  UNPAIRED_SINGLE_QUOTE() {
    return this.getToken(FirebaseRulesParser.UNPAIRED_SINGLE_QUOTE, 0);
  };

  UNPAIRED_DOUBLE_QUOTE() {
    return this.getToken(FirebaseRulesParser.UNPAIRED_DOUBLE_QUOTE, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLiteral(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLiteral(this);
    }
  }
}



class KeywordIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_keywordId;
  }

  IDENTIFIER() {
    return this.getToken(FirebaseRulesParser.IDENTIFIER, 0);
  };

  keyword() {
    return this.getTypedRuleContext(KeywordContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterKeywordId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitKeywordId(this);
    }
  }
}



class KeywordContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_keyword;
  }

  ALLOW() {
    return this.getToken(FirebaseRulesParser.ALLOW, 0);
  };

  FALSE() {
    return this.getToken(FirebaseRulesParser.FALSE, 0);
  };

  FUNCTION() {
    return this.getToken(FirebaseRulesParser.FUNCTION, 0);
  };

  IF() {
    return this.getToken(FirebaseRulesParser.IF, 0);
  };

  IMPORT() {
    return this.getToken(FirebaseRulesParser.IMPORT, 0);
  };

  IS() {
    return this.getToken(FirebaseRulesParser.IS, 0);
  };

  NULL() {
    return this.getToken(FirebaseRulesParser.NULL, 0);
  };

  RETURN() {
    return this.getToken(FirebaseRulesParser.RETURN, 0);
  };

  SERVICE() {
    return this.getToken(FirebaseRulesParser.SERVICE, 0);
  };

  TRUE() {
    return this.getToken(FirebaseRulesParser.TRUE, 0);
  };

  ARGUMENTS() {
    return this.getToken(FirebaseRulesParser.ARGUMENTS, 0);
  };

  BREAK() {
    return this.getToken(FirebaseRulesParser.BREAK, 0);
  };

  CASE() {
    return this.getToken(FirebaseRulesParser.CASE, 0);
  };

  CONTINUE() {
    return this.getToken(FirebaseRulesParser.CONTINUE, 0);
  };

  DEFAULT() {
    return this.getToken(FirebaseRulesParser.DEFAULT, 0);
  };

  DENY() {
    return this.getToken(FirebaseRulesParser.DENY, 0);
  };

  DO() {
    return this.getToken(FirebaseRulesParser.DO, 0);
  };

  EACH() {
    return this.getToken(FirebaseRulesParser.EACH, 0);
  };

  ELSE() {
    return this.getToken(FirebaseRulesParser.ELSE, 0);
  };

  EXTENDS() {
    return this.getToken(FirebaseRulesParser.EXTENDS, 0);
  };

  FOR() {
    return this.getToken(FirebaseRulesParser.FOR, 0);
  };

  GOTO() {
    return this.getToken(FirebaseRulesParser.GOTO, 0);
  };

  IN() {
    return this.getToken(FirebaseRulesParser.IN, 0);
  };

  LET() {
    return this.getToken(FirebaseRulesParser.LET, 0);
  };

  MATCH() {
    return this.getToken(FirebaseRulesParser.MATCH, 0);
  };

  NOT_TEXT() {
    return this.getToken(FirebaseRulesParser.NOT_TEXT, 0);
  };

  PACKAGE() {
    return this.getToken(FirebaseRulesParser.PACKAGE, 0);
  };

  SWITCH() {
    return this.getToken(FirebaseRulesParser.SWITCH, 0);
  };

  THEN() {
    return this.getToken(FirebaseRulesParser.THEN, 0);
  };

  VAR() {
    return this.getToken(FirebaseRulesParser.VAR, 0);
  };

  WHILE() {
    return this.getToken(FirebaseRulesParser.WHILE, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterKeyword(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitKeyword(this);
    }
  }
}



class PathDeclContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_pathDecl;
  }

  pathDeclSegment = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(PathDeclSegmentContext);
    } else {
      return this.getTypedRuleContext(PathDeclSegmentContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPathDecl(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPathDecl(this);
    }
  }
}



class PathDeclSegmentContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_pathDeclSegment;
  }



  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}


class SimpleSegmemntContext extends PathDeclSegmentContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  PATH_SEGMENT() {
    return this.getToken(FirebaseRulesParser.PATH_SEGMENT, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterSimpleSegmemnt(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitSimpleSegmemnt(this);
    }
  }
}

FirebaseRulesParser.SimpleSegmemntContext = SimpleSegmemntContext;

class CaptureSegmentContext extends PathDeclSegmentContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  SLASH() {
    return this.getToken(FirebaseRulesParser.SLASH, 0);
  };

  capture() {
    return this.getTypedRuleContext(CaptureContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterCaptureSegment(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitCaptureSegment(this);
    }
  }
}

FirebaseRulesParser.CaptureSegmentContext = CaptureSegmentContext;

class EmptySegmentContext extends PathDeclSegmentContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  SLASH() {
    return this.getToken(FirebaseRulesParser.SLASH, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterEmptySegment(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitEmptySegment(this);
    }
  }
}

FirebaseRulesParser.EmptySegmentContext = EmptySegmentContext;

class GlobSegmentContext extends PathDeclSegmentContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  SLASH() {
    return this.getToken(FirebaseRulesParser.SLASH, 0);
  };

  globCapture() {
    return this.getTypedRuleContext(GlobCaptureContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterGlobSegment(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitGlobSegment(this);
    }
  }
}

FirebaseRulesParser.GlobSegmentContext = GlobSegmentContext;

class GlobCaptureContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_globCapture;
  }

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  localVariableId() {
    return this.getTypedRuleContext(LocalVariableIdContext, 0);
  };

  ASSIGNMENT() {
    return this.getToken(FirebaseRulesParser.ASSIGNMENT, 0);
  };

  GLOB() {
    return this.getToken(FirebaseRulesParser.GLOB, 0);
  };

  RBRACE = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.RBRACE);
    } else {
      return this.getToken(FirebaseRulesParser.RBRACE, i);
    }
  };


  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterGlobCapture(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitGlobCapture(this);
    }
  }
}



class CaptureContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_capture;
  }

  LBRACE() {
    return this.getToken(FirebaseRulesParser.LBRACE, 0);
  };

  localVariableId() {
    return this.getTypedRuleContext(LocalVariableIdContext, 0);
  };

  RBRACE = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.RBRACE);
    } else {
      return this.getToken(FirebaseRulesParser.RBRACE, i);
    }
  };


  ASSIGNMENT() {
    return this.getToken(FirebaseRulesParser.ASSIGNMENT, 0);
  };

  STAR() {
    return this.getToken(FirebaseRulesParser.STAR, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterCapture(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitCapture(this);
    }
  }
}



class IdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_id;
  }

  IDENTIFIER() {
    return this.getToken(FirebaseRulesParser.IDENTIFIER, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitId(this);
    }
  }
}



class ServiceIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_serviceId;
  }

  BAD_KEYWORD() {
    return this.getToken(FirebaseRulesParser.BAD_KEYWORD, 0);
  };

  SERVICE_IDENTIFIER() {
    return this.getToken(FirebaseRulesParser.SERVICE_IDENTIFIER, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterServiceId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitServiceId(this);
    }
  }
}



class IsOperatorIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_isOperatorId;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterIsOperatorId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitIsOperatorId(this);
    }
  }
}



class OperationIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_operationId;
  }

  id = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(IdContext);
    } else {
      return this.getTypedRuleContext(IdContext, i);
    }
  };

  COMMA = function(i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(FirebaseRulesParser.COMMA);
    } else {
      return this.getToken(FirebaseRulesParser.COMMA, i);
    }
  };


  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterOperationId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitOperationId(this);
    }
  }
}



class PackageIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_packageId;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterPackageId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitPackageId(this);
    }
  }
}



class MemberIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_memberId;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterMemberId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitMemberId(this);
    }
  }
}



class AsContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_as;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterAs(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitAs(this);
    }
  }
}



class LocalVariableIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_localVariableId;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLocalVariableId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLocalVariableId(this);
    }
  }
}



class LocalFunctionIdContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = FirebaseRulesParser.RULE_localFunctionId;
  }

  id() {
    return this.getTypedRuleContext(IdContext, 0);
  };

  enterRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.enterLocalFunctionId(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof FirebaseRulesParserListener) {
      listener.exitLocalFunctionId(this);
    }
  }
}



FirebaseRulesParser.RulesetContext = RulesetContext;
FirebaseRulesParser.VersionStatementContext = VersionStatementContext;
FirebaseRulesParser.ImportStatementContext = ImportStatementContext;
FirebaseRulesParser.RulesetStatementContext = RulesetStatementContext;
FirebaseRulesParser.ServiceDeclarationContext = ServiceDeclarationContext;
FirebaseRulesParser.ServiceStatementContext = ServiceStatementContext;
FirebaseRulesParser.FunctionDeclarationContext = FunctionDeclarationContext;
FirebaseRulesParser.BindingDeclarationContext = BindingDeclarationContext;
FirebaseRulesParser.FunctionSignatureContext = FunctionSignatureContext;
FirebaseRulesParser.ParamListContext = ParamListContext;
FirebaseRulesParser.FunctionBodyContext = FunctionBodyContext;
FirebaseRulesParser.ReturnStatementContext = ReturnStatementContext;
FirebaseRulesParser.MatchRuleDeclarationContext = MatchRuleDeclarationContext;
FirebaseRulesParser.MatchStatementContext = MatchStatementContext;
FirebaseRulesParser.PermissionDeclarationContext = PermissionDeclarationContext;
FirebaseRulesParser.PermissionBodyContext = PermissionBodyContext;
FirebaseRulesParser.ExpressionContext = ExpressionContext;
FirebaseRulesParser.SimpleExpressionContext = SimpleExpressionContext;
FirebaseRulesParser.PathExpressionContext = PathExpressionContext;
FirebaseRulesParser.PathExpressionSegmentContext = PathExpressionSegmentContext;
FirebaseRulesParser.ListIndexContext = ListIndexContext;
FirebaseRulesParser.MapExpressionContext = MapExpressionContext;
FirebaseRulesParser.MapEntriesContext = MapEntriesContext;
FirebaseRulesParser.MapEntryContext = MapEntryContext;
FirebaseRulesParser.ExpressionListContext = ExpressionListContext;
FirebaseRulesParser.LiteralContext = LiteralContext;
FirebaseRulesParser.KeywordIdContext = KeywordIdContext;
FirebaseRulesParser.KeywordContext = KeywordContext;
FirebaseRulesParser.PathDeclContext = PathDeclContext;
FirebaseRulesParser.PathDeclSegmentContext = PathDeclSegmentContext;
FirebaseRulesParser.GlobCaptureContext = GlobCaptureContext;
FirebaseRulesParser.CaptureContext = CaptureContext;
FirebaseRulesParser.IdContext = IdContext;
FirebaseRulesParser.ServiceIdContext = ServiceIdContext;
FirebaseRulesParser.IsOperatorIdContext = IsOperatorIdContext;
FirebaseRulesParser.OperationIdContext = OperationIdContext;
FirebaseRulesParser.PackageIdContext = PackageIdContext;
FirebaseRulesParser.MemberIdContext = MemberIdContext;
FirebaseRulesParser.AsContext = AsContext;
FirebaseRulesParser.LocalVariableIdContext = LocalVariableIdContext;
FirebaseRulesParser.LocalFunctionIdContext = LocalFunctionIdContext;
