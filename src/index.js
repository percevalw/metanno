import React from 'react';
import './index.css';
import {createStore} from 'redux';
import * as ReactDOM from "react-dom";
import {Provider} from "react-redux";
import TableEditor from './containers/TableEditor';
import SpanEditor from './containers/SpanEditor';
import {combineReducersWithImmerActionReducer, createImmerActionHook} from "./immerAction";
// import '@jupyterlab/notebook/style/index.css'
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA

/*
serviceWorker.unregister();
*/
const default_state = {
    'counter': 0,
    'data': {
        'spans': [{
            'begin': 0,
            'end': 9,
            'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
            'style': 'OCCURRENCE',
            'id': 'T1', highlighted: false,
        },
            {
                'begin': 1009,
                'end': 1014,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T2', highlighted: false,
            },
            {
                'begin': 1035,
                'end': 1043,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T3', highlighted: false,
            },
            {
                'begin': 1057,
                'end': 1063,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T4', highlighted: false,
            },
            {
                'begin': 1069,
                'end': 1077,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T5', highlighted: false,
            },
            {
                'begin': 1081,
                'end': 1092,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T6', highlighted: false,
            },
            {
                'begin': 1114,
                'end': 1123,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T7', highlighted: false,
            },
            {
                'begin': 1137,
                'end': 1178,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T8', highlighted: false,
            },
            {
                'begin': 1184,
                'end': 1226,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T9', highlighted: false,
            },
            {
                'begin': 1237,
                'end': 1254,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T10', highlighted: false,
            },
            {
                'begin': 127,
                'end': 139,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T11', highlighted: false,
            },
            {
                'begin': 1280,
                'end': 1298,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T12', highlighted: false,
            },
            {
                'begin': 1301,
                'end': 1325,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T13', highlighted: false,
            },
            {
                'begin': 1330,
                'end': 1347,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T14', highlighted: false,
            },
            {
                'begin': 1373,
                'end': 1379,
                'label': ['EVIDENTIAL', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T15', highlighted: false,
            },
            {
                'begin': 1382,
                'end': 1393,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'TEST',
                'id': 'T16', highlighted: false,
            },
            {
                'begin': 1398,
                'end': 1413,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T17', highlighted: false,
            },
            {
                'begin': 1427,
                'end': 1431,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T18', highlighted: false,
            },
            {
                'begin': 1465,
                'end': 1494,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T19', highlighted: false,
            },
            {
                'begin': 1499,
                'end': 1517,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T20', highlighted: false,
            },
            {
                'begin': 1543,
                'end': 1572,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T21', highlighted: false,
            },
            {
                'begin': 160,
                'end': 169,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'EVIDENTIAL',
                'id': 'T22', highlighted: false,
            },
            {
                'begin': 1620,
                'end': 1627,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T23', highlighted: false,
            },
            {
                'begin': 1632,
                'end': 1642,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T24', highlighted: false,
            },
            {
                'begin': 1660,
                'end': 1672,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T25', highlighted: false,
            },
            {
                'begin': 1684,
                'end': 1697,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T26', highlighted: false,
            },
            {
                'begin': 1701,
                'end': 1735,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'PROBLEM',
                'id': 'T27', highlighted: false,
            },
            {
                'begin': 175,
                'end': 199,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T28', highlighted: false,
            },
            {
                'begin': 1802,
                'end': 1810,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'OCCURRENCE',
                'id': 'T29', highlighted: false,
            },
            {
                'begin': 1817,
                'end': 1850,
                'label': ['CLINICAL_DEPT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T30', highlighted: false,
            },
            {
                'begin': 1855,
                'end': 1858,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T31', highlighted: false,
            },
            {
                'begin': 1904,
                'end': 1912,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T32', highlighted: false,
            },
            {
                'begin': 1917,
                'end': 1930,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T33', highlighted: false,
            },
            {
                'begin': 1952,
                'end': 1964,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'OCCURRENCE',
                'id': 'T34', highlighted: false,
            },
            {
                'begin': 1991,
                'end': 1999,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T35', highlighted: false,
            },
            {
                'begin': 2003,
                'end': 2015,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'CLINICAL_DEPT',
                'id': 'T36', highlighted: false,
            },
            {
                'begin': 2059,
                'end': 2068,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T37', highlighted: false,
            },
            {
                'begin': 2090,
                'end': 2098,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T38', highlighted: false,
            },
            {
                'begin': 211,
                'end': 217,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T39', highlighted: false,
            },
            {
                'begin': 2114,
                'end': 2127,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T40', highlighted: false,
            },
            {
                'begin': 2131,
                'end': 2151,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T41', highlighted: false,
            },
            {
                'begin': 2194,
                'end': 2208,
                'label': ['EVIDENTIAL', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T42', highlighted: false,
            },
            {
                'begin': 222,
                'end': 230,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T43', highlighted: false,
            },
            {
                'begin': 2230,
                'end': 2244,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T44', highlighted: false,
            },
            {
                'begin': 2259,
                'end': 2268,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T45', highlighted: false,
            },
            {
                'begin': 2271,
                'end': 2290,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TEST',
                'id': 'T46', highlighted: false,
            },
            {
                'begin': 2314,
                'end': 2318,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'EVIDENTIAL',
                'id': 'T47', highlighted: false,
            },
            {
                'begin': 2323,
                'end': 2331,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T48', highlighted: false,
            },
            {
                'begin': 2336,
                'end': 2348,
                'label': ['PROBLEM', 'modality__POSSIBLE', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T49', highlighted: false,
            },
            {
                'begin': 2352,
                'end': 2364,
                'label': ['PROBLEM', 'modality__POSSIBLE', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T50', highlighted: false,
            },
            {
                'begin': 2367,
                'end': 2380,
                'label': ['PROBLEM', 'modality__POSSIBLE', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T51', highlighted: false,
            },
            {
                'begin': 240,
                'end': 265,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T52', highlighted: false,
            },
            {
                'begin': 2449,
                'end': 2469,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T53', highlighted: false,
            },
            {
                'begin': 2475,
                'end': 2482,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T54', highlighted: false,
            },
            {
                'begin': 2495,
                'end': 2503,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T55', highlighted: false,
            },
            {
                'begin': 276,
                'end': 285,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T56', highlighted: false,
            },
            {
                'begin': 28,
                'end': 37,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'OCCURRENCE',
                'id': 'T57', highlighted: false,
            },
            {
                'begin': 301,
                'end': 323,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T58', highlighted: false,
            },
            {
                'begin': 366,
                'end': 378,
                'label': ['PROBLEM', 'modality__POSSIBLE', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T59', highlighted: false,
            },
            {
                'begin': 422,
                'end': 440,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T60', highlighted: false,
            },
            {
                'begin': 448,
                'end': 473,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T61', highlighted: false,
            },
            {
                'begin': 492,
                'end': 517,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T62', highlighted: false,
            },
            {
                'begin': 548,
                'end': 565,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__NEG'],
                'style': 'PROBLEM',
                'id': 'T63', highlighted: false,
            },
            {
                'begin': 578,
                'end': 587,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T64', highlighted: false,
            },
            {
                'begin': 591,
                'end': 629,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T65', highlighted: false,
            },
            {
                'begin': 649,
                'end': 676,
                'label': ['TREATMENT', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T66', highlighted: false,
            },
            {
                'begin': 701,
                'end': 713,
                'label': ['TEST', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T67', highlighted: false,
            },
            {
                'begin': 718,
                'end': 726,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T68', highlighted: false,
            },
            {
                'begin': 730,
                'end': 733,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'TREATMENT',
                'id': 'T69', highlighted: false,
            },
            {
                'begin': 758,
                'end': 764,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T70', highlighted: false,
            },
            {
                'begin': 769,
                'end': 777,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T71', highlighted: false,
            },
            {
                'begin': 789,
                'end': 813,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T72', highlighted: false,
            },
            {
                'begin': 847,
                'end': 852,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'OCCURRENCE',
                'id': 'T73', highlighted: false,
            },
            {
                'begin': 887,
                'end': 899,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T74', highlighted: false,
            },
            {
                'begin': 945,
                'end': 953,
                'label': ['OCCURRENCE', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'PROBLEM',
                'id': 'T75', highlighted: false,
            },
            {
                'begin': 957,
                'end': 971,
                'label': ['DATE', 'mod__NA'],
                'style': 'PROBLEM',
                'id': 'T76', highlighted: false,
            },
            {
                'begin': 994,
                'end': 999,
                'label': ['DATE', 'mod__NA'],
                'style': 'OCCURRENCE',
                'id': 'T77', highlighted: false,
            },
            {
                'begin': 1098,
                'end': 1103,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'DATE',
                'id': 'T78', highlighted: false,
            },
            {
                'begin': 1258,
                'end': 1267,
                'label': ['DURATION', 'mod__NA'],
                'style': 'DATE',
                'id': 'T79', highlighted: false,
            },
            {
                'begin': 144,
                'end': 153,
                'label': ['DATE', 'mod__NA'],
                'style': 'DURATION',
                'id': 'T80', highlighted: false,
            },
            {
                'begin': 1576,
                'end': 1580,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T81', highlighted: false,
            },
            {
                'begin': 1646,
                'end': 1655,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T82', highlighted: false,
            },
            {'begin': 17, 'end': 27, 'label': ['DATE', 'mod__NA'], 'style': 'DATE', 'id': 'T83', highlighted: false,},
            {
                'begin': 2021,
                'end': 2043,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T84', highlighted: false,
            },
            {
                'begin': 2155,
                'end': 2162,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T85', highlighted: false,
            },
            {
                'begin': 2248,
                'end': 2270,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T86', highlighted: false,
            },
            {
                'begin': 2399,
                'end': 2404,
                'label': ['DATE', 'mod__NA'],
                'style': 'DATE',
                'id': 'T87', highlighted: false,
            },
            {'begin': 289, 'end': 293, 'label': ['DATE', 'mod__NA'], 'style': 'DATE', 'id': 'T88', highlighted: false,},
            {
                'begin': 45,
                'end': 55,
                'label': ['PROBLEM', 'modality__FACTUAL', 'polarity__POS'],
                'style': 'DATE',
                'id': 'T89', highlighted: false,
            },
            {'begin': 523, 'end': 532, 'label': ['DATE', 'mod__NA'], 'style': 'DATE', 'id': 'T90', highlighted: false,},
            {
                'begin': 858,
                'end': 872,
                'label': ['DURATION', 'mod__NA'],
                'style': 'DURATION',
                'id': 'T91', highlighted: false,
            },
            {
                'begin': 919,
                'end': 928,
                'label': ['DURATION', 'mod__NA'],
                'style': 'DURATION',
                'id': 'T92', highlighted: false,
            }],
        'docs': [
            {'doc_id': {'text': '1.xml', 'key': '1.xml'}, 'split': 'train'},
            {'doc_id': {'text': '107.xml', 'key': '107.xml'}, 'split': 'val'},
            {'doc_id': {'text': '11.xml', 'key': '11.xml'}, 'split': 'train'},
            {'doc_id': {'text': '116.xml', 'key': '116.xml'}, 'split': 'train'},
            {'doc_id': {'text': '121.xml', 'key': '121.xml'}, 'split': 'train'},
            {'doc_id': {'text': '122.xml', 'key': '122.xml'}, 'split': 'train'},
            {'doc_id': {'text': '123.xml', 'key': '123.xml'}, 'split': 'train'},
            {'doc_id': {'text': '126.xml', 'key': '126.xml'}, 'split': 'val'},
            {'doc_id': {'text': '141.xml', 'key': '141.xml'}, 'split': 'train'},
            {'doc_id': {'text': '143.xml', 'key': '143.xml'}, 'split': 'train'},
            {'doc_id': {'text': '151.xml', 'key': '151.xml'}, 'split': 'train'},
            {'doc_id': {'text': '152.xml', 'key': '152.xml'}, 'split': 'val'},
            {'doc_id': {'text': '153.xml', 'key': '153.xml'}, 'split': 'val'},
            {'doc_id': {'text': '156.xml', 'key': '156.xml'}, 'split': 'train'},
            {'doc_id': {'text': '16.xml', 'key': '16.xml'}, 'split': 'train'},
            {'doc_id': {'text': '162.xml', 'key': '162.xml'}, 'split': 'train'},
            {'doc_id': {'text': '163.xml', 'key': '163.xml'}, 'split': 'train'},
            {'doc_id': {'text': '166.xml', 'key': '166.xml'}, 'split': 'train'},
            {'doc_id': {'text': '167.xml', 'key': '167.xml'}, 'split': 'train'},
            {'doc_id': {'text': '168.xml', 'key': '168.xml'}, 'split': 'train'},
            {'doc_id': {'text': '172.xml', 'key': '172.xml'}, 'split': 'train'},
            {'doc_id': {'text': '173.xml', 'key': '173.xml'}, 'split': 'train'},
            {'doc_id': {'text': '177.xml', 'key': '177.xml'}, 'split': 'train'},
            {'doc_id': {'text': '178.xml', 'key': '178.xml'}, 'split': 'train'},
            {'doc_id': {'text': '18.xml', 'key': '18.xml'}, 'split': 'train'},
            {'doc_id': {'text': '182.xml', 'key': '182.xml'}, 'split': 'train'},
            {'doc_id': {'text': '186.xml', 'key': '186.xml'}, 'split': 'train'},
            {'doc_id': {'text': '188.xml', 'key': '188.xml'}, 'split': 'train'},
            {'doc_id': {'text': '191.xml', 'key': '191.xml'}, 'split': 'train'},
            {'doc_id': {'text': '192.xml', 'key': '192.xml'}, 'split': 'train'},
            {'doc_id': {'text': '193.xml', 'key': '193.xml'}, 'split': 'train'},
            {'doc_id': {'text': '197.xml', 'key': '197.xml'}, 'split': 'train'},
            {'doc_id': {'text': '2.xml', 'key': '2.xml'}, 'split': 'train'},
            {'doc_id': {'text': '201.xml', 'key': '201.xml'}, 'split': 'val'},
            {'doc_id': {'text': '203.xml', 'key': '203.xml'}, 'split': 'val'},
            {'doc_id': {'text': '212.xml', 'key': '212.xml'}, 'split': 'val'},
            {'doc_id': {'text': '213.xml', 'key': '213.xml'}, 'split': 'train'},
            {'doc_id': {'text': '216.xml', 'key': '216.xml'}, 'split': 'train'},
            {'doc_id': {'text': '218.xml', 'key': '218.xml'}, 'split': 'train'},
            {'doc_id': {'text': '23.xml', 'key': '23.xml'}, 'split': 'train'},
            {'doc_id': {'text': '236.xml', 'key': '236.xml'}, 'split': 'train'},
            {'doc_id': {'text': '237.xml', 'key': '237.xml'}, 'split': 'train'},
            {'doc_id': {'text': '242.xml', 'key': '242.xml'}, 'split': 'train'},
            {'doc_id': {'text': '247.xml', 'key': '247.xml'}, 'split': 'val'},
            {'doc_id': {'text': '248.xml', 'key': '248.xml'}, 'split': 'train'},
            {'doc_id': {'text': '252.xml', 'key': '252.xml'}, 'split': 'train'},
            {'doc_id': {'text': '256.xml', 'key': '256.xml'}, 'split': 'train'},
            {'doc_id': {'text': '26.xml', 'key': '26.xml'}, 'split': 'train'},
            {'doc_id': {'text': '267.xml', 'key': '267.xml'}, 'split': 'train'},
            {'doc_id': {'text': '271.xml', 'key': '271.xml'}, 'split': 'train'},
            {'doc_id': {'text': '272.xml', 'key': '272.xml'}, 'split': 'val'},
            {'doc_id': {'text': '273.xml', 'key': '273.xml'}, 'split': 'train'},
            {'doc_id': {'text': '28.xml', 'key': '28.xml'}, 'split': 'val'},
            {'doc_id': {'text': '291.xml', 'key': '291.xml'}, 'split': 'val'},
            {'doc_id': {'text': '3.xml', 'key': '3.xml'}, 'split': 'train'},
            {'doc_id': {'text': '301.xml', 'key': '301.xml'}, 'split': 'val'},
            {'doc_id': {'text': '302.xml', 'key': '302.xml'}, 'split': 'train'},
            {'doc_id': {'text': '307.xml', 'key': '307.xml'}, 'split': 'train'},
            {'doc_id': {'text': '308.xml', 'key': '308.xml'}, 'split': 'train'},
            {'doc_id': {'text': '311.xml', 'key': '311.xml'}, 'split': 'train'},
            {'doc_id': {'text': '313.xml', 'key': '313.xml'}, 'split': 'train'},
            {'doc_id': {'text': '316.xml', 'key': '316.xml'}, 'split': 'train'},
            {'doc_id': {'text': '318.xml', 'key': '318.xml'}, 'split': 'val'},
            {'doc_id': {'text': '321.xml', 'key': '321.xml'}, 'split': 'train'},
            {'doc_id': {'text': '331.xml', 'key': '331.xml'}, 'split': 'train'},
            {'doc_id': {'text': '332.xml', 'key': '332.xml'}, 'split': 'train'},
            {'doc_id': {'text': '336.xml', 'key': '336.xml'}, 'split': 'train'},
            {'doc_id': {'text': '337.xml', 'key': '337.xml'}, 'split': 'val'},
            {'doc_id': {'text': '343.xml', 'key': '343.xml'}, 'split': 'train'},
            {'doc_id': {'text': '346.xml', 'key': '346.xml'}, 'split': 'val'},
            {'doc_id': {'text': '348.xml', 'key': '348.xml'}, 'split': 'train'},
            {'doc_id': {'text': '351.xml', 'key': '351.xml'}, 'split': 'train'},
            {'doc_id': {'text': '352.xml', 'key': '352.xml'}, 'split': 'train'},
            {'doc_id': {'text': '353.xml', 'key': '353.xml'}, 'split': 'val'},
            {'doc_id': {'text': '356.xml', 'key': '356.xml'}, 'split': 'train'},
            {'doc_id': {'text': '357.xml', 'key': '357.xml'}, 'split': 'train'},
            {'doc_id': {'text': '36.xml', 'key': '36.xml'}, 'split': 'train'},
            {'doc_id': {'text': '362.xml', 'key': '362.xml'}, 'split': 'train'},
            {'doc_id': {'text': '366.xml', 'key': '366.xml'}, 'split': 'train'},
            {'doc_id': {'text': '367.xml', 'key': '367.xml'}, 'split': 'train'},
            {'doc_id': {'text': '373.xml', 'key': '373.xml'}, 'split': 'val'},
            {'doc_id': {'text': '376.xml', 'key': '376.xml'}, 'split': 'train'},
            {'doc_id': {'text': '38.xml', 'key': '38.xml'}, 'split': 'train'},
            {'doc_id': {'text': '382.xml', 'key': '382.xml'}, 'split': 'train'},
            {'doc_id': {'text': '386.xml', 'key': '386.xml'}, 'split': 'train'},
            {'doc_id': {'text': '387.xml', 'key': '387.xml'}, 'split': 'train'},
            {'doc_id': {'text': '388.xml', 'key': '388.xml'}, 'split': 'train'},
            {'doc_id': {'text': '393.xml', 'key': '393.xml'}, 'split': 'train'},
            {'doc_id': {'text': '396.xml', 'key': '396.xml'}, 'split': 'val'},
            {'doc_id': {'text': '407.xml', 'key': '407.xml'}, 'split': 'train'},
            {'doc_id': {'text': '408.xml', 'key': '408.xml'}, 'split': 'train'},
            {'doc_id': {'text': '411.xml', 'key': '411.xml'}, 'split': 'train'},
            {'doc_id': {'text': '413.xml', 'key': '413.xml'}, 'split': 'train'},
            {'doc_id': {'text': '417.xml', 'key': '417.xml'}, 'split': 'train'},
            {'doc_id': {'text': '42.xml', 'key': '42.xml'}, 'split': 'train'},
            {'doc_id': {'text': '422.xml', 'key': '422.xml'}, 'split': 'train'},
            {'doc_id': {'text': '423.xml', 'key': '423.xml'}, 'split': 'train'},
            {'doc_id': {'text': '426.xml', 'key': '426.xml'}, 'split': 'train'},
            {'doc_id': {'text': '427.xml', 'key': '427.xml'}, 'split': 'train'},
            {'doc_id': {'text': '43.xml', 'key': '43.xml'}, 'split': 'train'},
            {'doc_id': {'text': '432.xml', 'key': '432.xml'}, 'split': 'train'},
            {'doc_id': {'text': '433.xml', 'key': '433.xml'}, 'split': 'train'},
            {'doc_id': {'text': '437.xml', 'key': '437.xml'}, 'split': 'train'},
            {'doc_id': {'text': '438.xml', 'key': '438.xml'}, 'split': 'train'},
            {'doc_id': {'text': '452.xml', 'key': '452.xml'}, 'split': 'val'},
            {'doc_id': {'text': '458.xml', 'key': '458.xml'}, 'split': 'train'},
            {'doc_id': {'text': '462.xml', 'key': '462.xml'}, 'split': 'train'},
            {'doc_id': {'text': '463.xml', 'key': '463.xml'}, 'split': 'train'},
            {'doc_id': {'text': '468.xml', 'key': '468.xml'}, 'split': 'train'},
            {'doc_id': {'text': '47.xml', 'key': '47.xml'}, 'split': 'train'},
            {'doc_id': {'text': '471.xml', 'key': '471.xml'}, 'split': 'train'},
            {'doc_id': {'text': '472.xml', 'key': '472.xml'}, 'split': 'train'},
            {'doc_id': {'text': '473.xml', 'key': '473.xml'}, 'split': 'val'},
            {'doc_id': {'text': '481.xml', 'key': '481.xml'}, 'split': 'val'},
            {'doc_id': {'text': '482.xml', 'key': '482.xml'}, 'split': 'train'},
            {'doc_id': {'text': '491.xml', 'key': '491.xml'}, 'split': 'val'},
            {'doc_id': {'text': '492.xml', 'key': '492.xml'}, 'split': 'val'},
            {'doc_id': {'text': '496.xml', 'key': '496.xml'}, 'split': 'train'},
            {'doc_id': {'text': '497.xml', 'key': '497.xml'}, 'split': 'val'},
            {'doc_id': {'text': '502.xml', 'key': '502.xml'}, 'split': 'train'},
            {'doc_id': {'text': '51.xml', 'key': '51.xml'}, 'split': 'val'},
            {'doc_id': {'text': '511.xml', 'key': '511.xml'}, 'split': 'val'},
            {'doc_id': {'text': '512.xml', 'key': '512.xml'}, 'split': 'train'},
            {'doc_id': {'text': '517.xml', 'key': '517.xml'}, 'split': 'train'},
            {'doc_id': {'text': '521.xml', 'key': '521.xml'}, 'split': 'train'},
            {'doc_id': {'text': '522.xml', 'key': '522.xml'}, 'split': 'train'},
            {'doc_id': {'text': '526.xml', 'key': '526.xml'}, 'split': 'val'},
            {'doc_id': {'text': '532.xml', 'key': '532.xml'}, 'split': 'val'},
            {'doc_id': {'text': '541.xml', 'key': '541.xml'}, 'split': 'train'},
            {'doc_id': {'text': '546.xml', 'key': '546.xml'}, 'split': 'train'},
            {'doc_id': {'text': '547.xml', 'key': '547.xml'}, 'split': 'train'},
            {'doc_id': {'text': '557.xml', 'key': '557.xml'}, 'split': 'train'},
            {'doc_id': {'text': '567.xml', 'key': '567.xml'}, 'split': 'train'},
            {'doc_id': {'text': '571.xml', 'key': '571.xml'}, 'split': 'train'},
            {'doc_id': {'text': '572.xml', 'key': '572.xml'}, 'split': 'val'},
            {'doc_id': {'text': '576.xml', 'key': '576.xml'}, 'split': 'train'},
            {'doc_id': {'text': '577.xml', 'key': '577.xml'}, 'split': 'train'},
            {'doc_id': {'text': '582.xml', 'key': '582.xml'}, 'split': 'train'},
            {'doc_id': {'text': '587.xml', 'key': '587.xml'}, 'split': 'train'},
            {'doc_id': {'text': '591.xml', 'key': '591.xml'}, 'split': 'val'},
            {'doc_id': {'text': '596.xml', 'key': '596.xml'}, 'split': 'val'},
            {'doc_id': {'text': '6.xml', 'key': '6.xml'}, 'split': 'train'},
            {'doc_id': {'text': '602.xml', 'key': '602.xml'}, 'split': 'train'},
            {'doc_id': {'text': '611.xml', 'key': '611.xml'}, 'split': 'train'},
            {'doc_id': {'text': '612.xml', 'key': '612.xml'}, 'split': 'train'},
            {'doc_id': {'text': '622.xml', 'key': '622.xml'}, 'split': 'train'},
            {'doc_id': {'text': '626.xml', 'key': '626.xml'}, 'split': 'train'},
            {'doc_id': {'text': '631.xml', 'key': '631.xml'}, 'split': 'train'},
            {'doc_id': {'text': '636.xml', 'key': '636.xml'}, 'split': 'train'},
            {'doc_id': {'text': '637.xml', 'key': '637.xml'}, 'split': 'train'},
            {'doc_id': {'text': '641.xml', 'key': '641.xml'}, 'split': 'val'},
            {'doc_id': {'text': '642.xml', 'key': '642.xml'}, 'split': 'train'},
            {'doc_id': {'text': '647.xml', 'key': '647.xml'}, 'split': 'train'},
            {'doc_id': {'text': '656.xml', 'key': '656.xml'}, 'split': 'train'},
            {'doc_id': {'text': '666.xml', 'key': '666.xml'}, 'split': 'val'},
            {'doc_id': {'text': '676.xml', 'key': '676.xml'}, 'split': 'train'},
            {'doc_id': {'text': '68.xml', 'key': '68.xml'}, 'split': 'train'},
            {'doc_id': {'text': '681.xml', 'key': '681.xml'}, 'split': 'train'},
            {'doc_id': {'text': '682.xml', 'key': '682.xml'}, 'split': 'train'},
            {'doc_id': {'text': '692.xml', 'key': '692.xml'}, 'split': 'train'},
            {'doc_id': {'text': '697.xml', 'key': '697.xml'}, 'split': 'train'},
            {'doc_id': {'text': '701.xml', 'key': '701.xml'}, 'split': 'train'},
            {'doc_id': {'text': '707.xml', 'key': '707.xml'}, 'split': 'train'},
            {'doc_id': {'text': '711.xml', 'key': '711.xml'}, 'split': 'train'},
            {'doc_id': {'text': '717.xml', 'key': '717.xml'}, 'split': 'train'},
            {'doc_id': {'text': '72.xml', 'key': '72.xml'}, 'split': 'val'},
            {'doc_id': {'text': '721.xml', 'key': '721.xml'}, 'split': 'train'},
            {'doc_id': {'text': '722.xml', 'key': '722.xml'}, 'split': 'train'},
            {'doc_id': {'text': '726.xml', 'key': '726.xml'}, 'split': 'train'},
            {'doc_id': {'text': '736.xml', 'key': '736.xml'}, 'split': 'train'},
            {'doc_id': {'text': '747.xml', 'key': '747.xml'}, 'split': 'train'},
            {'doc_id': {'text': '751.xml', 'key': '751.xml'}, 'split': 'train'},
            {'doc_id': {'text': '756.xml', 'key': '756.xml'}, 'split': 'train'},
            {'doc_id': {'text': '757.xml', 'key': '757.xml'}, 'split': 'train'},
            {'doc_id': {'text': '776.xml', 'key': '776.xml'}, 'split': 'train'},
            {'doc_id': {'text': '777.xml', 'key': '777.xml'}, 'split': 'train'},
            {'doc_id': {'text': '786.xml', 'key': '786.xml'}, 'split': 'train'},
            {'doc_id': {'text': '787.xml', 'key': '787.xml'}, 'split': 'train'},
            {'doc_id': {'text': '791.xml', 'key': '791.xml'}, 'split': 'val'},
            {'doc_id': {'text': '797.xml', 'key': '797.xml'}, 'split': 'train'},
            {'doc_id': {'text': '8.xml', 'key': '8.xml'}, 'split': 'train'},
            {'doc_id': {'text': '801.xml', 'key': '801.xml'}, 'split': 'train'},
            {'doc_id': {'text': '807.xml', 'key': '807.xml'}, 'split': 'val'},
            {'doc_id': {'text': '81.xml', 'key': '81.xml'}, 'split': 'val'},
            {'doc_id': {'text': '86.xml', 'key': '86.xml'}, 'split': 'train'},
            {'doc_id': {'text': '87.xml', 'key': '87.xml'}, 'split': 'train'},
            {'doc_id': {'text': '92.xml', 'key': '92.xml'}, 'split': 'val'},
            {'doc_id': {'text': '93.xml', 'key': '93.xml'}, 'split': 'train'},
            {'doc_id': {'text': '96.xml', 'key': '96.xml'}, 'split': 'train'},
            {'doc_id': {'text': '98.xml', 'key': '98.xml'}, 'split': 'train'}],
        'text': 'Admission Date : 09/29/1993 Discharge Date : 10/04/1993 HISTORY OF PRESENT ILLNESS : The patient is a 28-year-old woman who is HIV positive for two years . She presented with left upper quadrant pain as well as nausea and vomiting which is a long-standing complaint . She was diagnosed in 1991 during the birth of her child . She claims she does not know why she is HIV positive . She is from Maryland , apparently had no blood transfusions before the birth of her children so it is presumed heterosexual transmission . At that time , she also had cat scratch fever and she had resection of an abscess in the left lower extremity . She has not used any anti retroviral therapy since then , because of pancytopenia and vomiting on DDI . She has complaints of nausea and vomiting as well as left upper quadrant pain on and off getting progressively worse over the past month .\nShe has had similar pain intermittently for last year .\nShe described the pain as a burning pain which is positional , worse when she walks or does any type of exercise .\nShe has no relief from antacids or H2 blockers .\nIn 10/92 , she had a CT scan which showed fatty infiltration of her liver diffusely with a 1 cm cyst in the right lobe of the liver .\nShe had a normal pancreas at that time , however , hyperdense kidneys .\nHer alkaline phosphatase was slightly elevated but otherwise relatively normal .\nHer amylase was mildly elevated but has been down since then .\nThe patient has had progressive failure to thrive and steady weight loss .\nShe was brought in for an esophagogastroduodenoscopy on 9/26 but she basically was not sufficiently sedated and readmitted at this time for a GI work-up as well as an evaluation of new abscess in her left lower calf and right medial lower extremity quadriceps muscle .\nShe was also admitted to be connected up with social services for HIV patients .\nHOSPITAL COURSE :\nThe patient was admitted and many cultures were sent which were all negative .\nShe did not have any of her pain in the hospital .\nOn the third hospital day , she did have some pain and was treated with Percocet .\nShe went for a debridement of her left calf lesion on 10/2/93 and was started empirically on IV ceftriaxone which was changed to po doxycycline on the day of discharge .\nA follow-up CT scan was done which did not show any evidence for splenomegaly or hepatomegaly .\nThe 1 cm cyst which was seen in 10/92 was still present .\nThere was a question of a cyst in her kidney with a stone right below the cyst , although this did not seem to be clinically significant .\n',
    },
    'custom': {},
    'mouse_selection': [],
};

const store = createStore(
    combineReducersWithImmerActionReducer(
    (state, action) => {
        if (action['type'] === "ADD_SPANS_HIGHLIGHT") {
            console.log(action);
            return {
                ...state,
                "data": {
                    ...state.data,
                    spans: state["data"]["spans"].map(span => (
                        action["payload"]["span_ids"].includes(span['id']) ? {
                            ...span,
                            highlighted: true,
                        } : span)
                    ),
                }
            };
        }
        else if (action['type'] === "CHANGE_TABLE_CELL")
            return {
                ...state,
                "editors": {
                    ...state["editors"],
                    [action["payload"]["editor_id"]]: {
                        ...state["editors"][action["payload"]["editor_id"]],
                        "rows": state["editors"][action["payload"]["editor_id"]]["rows"].map((row, i) =>
                            (i === action["payload"]["row"]) ? {
                                ...row,
                                [action["payload"]["column"]]: action["payload"]["value"]
                            } : row
                        ),
                    }
                }
            };
        else if (action['type'] === "HIGHLIGHT_ROWS")
            return {
                ...state,
                data: {
                    ...state.data,
                    "spans": state["data"]["spans"].map((row, i) => {
                        const willHighlight = action["payload"]["rows"].includes(i);
                        return row.highlighted !== willHighlight ? {
                            ...row,
                            highlighted: willHighlight,
                        } : row
                    })
                }
            };
        else if (action['type'] === "REMOVE_SPANS_HIGHLIGHT")
            return {
                ...state,
                "data": {
                    ...state.data,
                    spans: state["data"]["spans"].map(span => (
                        action["payload"]["span_ids"].includes(span['id']) ? {
                            ...span,
                            highlighted: false,
                        } : span)
                    ),
                }
            };
        else if (action['type'] === "CHANGE_SELECTED_TABLE_POSITION")
            return {
                ...state,
                selected_table_position: action["payload"],
            };
        return state;
    }, default_state), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

const immerAction = createImmerActionHook(store);
window.store = store;

setTimeout(() => {
    immerAction(state => {
        state.data.spans.each(span => {span.highlighted = false});
        state.data.spans[2].highlighted = true;
    });
}, 2000);
setTimeout(() => {
    immerAction(state => {
        state.data.spans.each(span => {span.highlighted = false});
        state.data.spans[3].highlighted = true;
    });
}, 4000);

const selectEditorState = (state, id) => {
    if (id === 'doc_editor') {
        return {
            text: state.data.text,
            spans: state.data.spans.map(
                ({begin, end, id, label, highlighted}) => ({
                    begin, end, id, label: label[0], style: label[0], highlighted,
                })
            ),
            'mouse_selection': state.mouse_selection,
            'buttons': [],
            'styles': {
                'OCCURRENCE': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'TREATMENT': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'TEST': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'PROBLEM': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'EVIDENTIAL': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'CLINICAL_DEPT': {'color': '#ff5b5b', 'border': '#ff5b5b'},
                'DATE': {'color': '#0f8edc', 'border': '#0f8edc'},
                'DURATION': {'color': '#0f8edc', 'border': '#0f8edc'},
                'FREQUENCY': {'color': '#0f8edc', 'border': '#0f8edc'},
                'TIME': {'color': '#0f8edc', 'border': '#0f8edc'}
            }
        };
    }
    if (id === 'mentions_table') {
        return {
            rows: state.data.spans.map(
                ({begin, end, id, label, highlighted}) => ({
                    mention_id: {text: state.data.text.substring(begin, end), key: id},
                    key: state.data.text.substring(begin, end),
                    label: label,
                    highlighted: highlighted,
                })
            ),
            rowKey: 'key',
            columns: [
                //{'name': 'id', 'type': 'text'},
                {'name': 'mention_id', 'type': 'hyperlink', readonly: false, suggestions: [{key: 'id1', text: "id1"}, {key: "T2", text: "un petit texte"}]},
                {'name': 'label', 'type': 'multi-text', readonly: false}],
            buttons: [],
            styles: {}
        };
    }
    if (id === 'docs_table') {
        return {
            rows: state.data.docs.map(doc => ({doc_id: doc.doc_id, split: doc.split, key: doc.doc_id.key})),
            'rowKey': 'key',
            'columns': [
                {
                    'name': 'doc_id', 'type': 'hyperlink', 'suggestions': [
                        {'text': '98.xml', 'key': '98.xml'},
                        {'text': 'test !', 'key': '81.xml'}
                    ]
                },
                {'name': 'split', 'type': 'text', 'suggestions': ['train', 'dev', 'test']}
            ],
            'buttons': [],
            'styles': {}
        };
    }
    throw Error(`Unknown ${id}`)
};

ReactDOM.render(
    <Provider store={store}>
        <div
            className="notfullheight">
            <TableEditor
                id="docs_table"
                onSelectCells={(cells) => console.log(cells)}
                onChange={immerAction("SET_TABLE_CELL", (state, row, column, value) => {
                    state.data.docs[row][column] = value;
                })}
                onSelectedPositionChange={immerAction("SET_TABLE_POSITION",(state, position) => {
                    state.editors.docs_table.selected_table_position = position;
                })}
                onClickCellContent={console.log}
                selectEditorState={selectEditorState}
            />
        </div>
        <div
            className="notfullheight">
            <TableEditor
                id="mentions_table"
                onSelectCells={(cells) => console.log(cells)}
                /*onChange={(row, column, value) => immerAction(state => {
                    state.docs[row][column] = value;
                })}*/
                onSelectedPositionChange={immerAction("SET_TABLE_POSITION", (state, position) => {
                    state.editors.mentions_table.selected_table_position = position;
                })}
                onCellChange={(...args) => console.log("CELL CHANGE", ...args)}
                onClickCellContent={console.log}
                selectEditorState={selectEditorState}
            />
        </div>
        <SpanEditor
            id="doc_editor"
            onKeyPress={() => {
                return true;
            }}
            /*onClickSpan={immerAction(state => {
                const {mode, rowIdx, idx, editor_id} = store.getState()['selected_table_position'];
                if (mode === 'EDIT') {
                    const tableState = store.getState()['editors'][editor_id];
                    const column = tableState['columns'][idx - 1]['name'];
                    const newValue = [...tableState['rows'][rowIdx][column], {key: span, text: span}];
                    store.dispatch({
                        'type': 'CHANGE_TABLE_CELL',
                        'payload': {
                            "editor_id": editor_id,
                            "row": rowIdx,
                            "column": column,
                            "value": newValue,
                        }
                    });
                    return true;
                }
            })}*/
            onEnterSpan={immerAction("ADD_SPAN_HIGHLIGHT", (state, span_id) => {
                state.data.spans.forEach(span => {
                    if (span_id === span["id"]) span.highlighted = true;
                });
            })}
            onLeaveSpan={immerAction("REMOVE_SPAN_HIGHLIGHT", (state, span_id) => {
                state.data.spans.forEach(span => {
                    if (span_id === span["id"]) span.highlighted = false;
                });
            })}
            onMouseSelect={() => {}}
            registerActions={() => {}}
            selectEditorState={selectEditorState}
        />
    </Provider>,
    document.getElementById("root")
);