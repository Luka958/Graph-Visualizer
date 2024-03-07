#ifndef ALGORITHM_H
#define ALGORITHM_H

#include <stdio.h>
#include <iostream>
#include <node_api.h>

using namespace std;

typedef napi_value(*CreateResultArrPtr)(napi_env, const napi_callback_info info, vector<napi_value>);
typedef napi_value(*CreateResultArrElPtr)(napi_env, const napi_callback_info, unsigned int, vector<napi_value>);
typedef napi_value(*CreateOtherArrElPtr)(napi_env, const napi_callback_info, unsigned int, unsigned int);

napi_value dijkstra(
	vector<Vertex*> vertices, vector<Edge*> edges,
	napi_env env, const napi_callback_info info, 
	CreateResultArrPtr createResultArr, CreateResultArrElPtr createResultArrEl, CreateOtherArrElPtr createOtherArrEl
);

#endif /* ALGORITHM_H */