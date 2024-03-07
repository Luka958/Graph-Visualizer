#ifndef EDGE_H
#define EDGE_H

#include <stdio.h>
#include <vector>

using namespace std;

class Edge
{
public:
    unsigned int id;
    vector<unsigned int> adjacent;
    vector<unsigned int> connection;
    double weight;

    Edge(unsigned int id,
         vector<unsigned int> adjacent,
         vector<unsigned int> connection,
         double weight) : id(id), adjacent(adjacent), connection(connection), weight(weight) {}

    ~Edge() {}
};

#endif /* EDGE_H */