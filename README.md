# RRT-Algorithm
Optimal Pathfinding algorithm

Hey, this is my implementation of the RTT* Algorithm. 

For those unfamiliar with the RRT* algorithm it aims to use sampling to create the near-optimal path between points A and B, randomly creating paths from existing points. In order to achieve a "near-optimal path" it has to be a dynamic tree capable of restructuring itself when it notices that one way is faster than another. This is the primary difficulty in implementing the algorithm.

Basically, the steps look like this:
-Generate random coordinate in the canvas
-Find the nearest node to said coordinate and generate a node kPathLength away in the direction of the coordinate. The nearest node = parent.
-Check if there is another node nearby to the new node that is closer than the parent node. If so, reassign relationships. Refactor total distance from start.
-If you refactored, update all the children of the children nodes with new distances from start
-Do this until you have a massive web connecting points A and B, then continue to find a better path.
-A few other algorithmic nuances that make sure everything works + everything preforms well and quickly

Although there's a possibility of a slight error regarding parent/child relations, (I suspect a line or two might be off,) all of my testing of it has produced very reasonable results, and everything runs. Only once or twice have I though that there could be a quicker route between Point A and B, but I have yet to mathematically prove that (it would be difficult given the number of nodes.) It is highly possible I'm just being paranoid. In any event, the algorithm produces very viable paths that are almost universally better than what you might get if you used a standard RRT algorithm. I believe this implementation would be ready for use in a simple autonomous system, provided it works in a structured environment.

Uses of other peoples' material or artificial intelligence:
-I used the RBush library to performantly find collisions and the nearest nodes to given points
-I used artificial intelligence for UI generation (I'm working with Raptor mini so I couldn't use it on other stuff if I wanted to).


