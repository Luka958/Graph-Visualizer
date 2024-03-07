#ifndef VERTEX_H
#define VERTEX_H

#include <stdio.h>
#include <vector>

using namespace std;

class Vertex 
{
public:
    unsigned int id;
    vector<unsigned int> neighbours;
    
    Vertex(unsigned int id, vector<unsigned int> neighbours) : id(id), neighbours(neighbours) {}
    
    ~Vertex() {}
};



#endif /* VERTEX_H */