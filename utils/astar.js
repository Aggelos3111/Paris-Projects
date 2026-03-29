function euclideanDistance(nodeA, nodeB) {
  return Math.sqrt(
    (nodeB.x - nodeA.x) ** 2 +
    (nodeB.y - nodeA.y) ** 2
  );
}

function buildGraph(edges) {
  const adjacency = new Map();

  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }

    if (!adjacency.has(edge.to)) {
      adjacency.set(edge.to, []);
    }

    adjacency.get(edge.from).push({ id: edge.to, weight: edge.weight });
    adjacency.get(edge.to).push({ id: edge.from, weight: edge.weight });
  }

  return adjacency;
}

function reconstructPath(cameFrom, current) {
  const path = [current];

  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    path.unshift(current);
  }

  return path;
}

function findLowestFScore(openSet, fScore) {
  let bestNode = null;
  let bestScore = Infinity;

  for (const nodeId of openSet) {
    const score = fScore.get(nodeId) ?? Infinity;

    if (score < bestScore) {
      bestScore = score;
      bestNode = nodeId;
    }
  }

  return bestNode;
}

export default function findPath(nodes, edges, startNodeId, endNodeId) {
  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
  const startNode = nodeLookup.get(startNodeId);
  const endNode = nodeLookup.get(endNodeId);

  if (!startNode || !endNode) {
    return null;
  }

  const adjacency = buildGraph(edges);
  const openSet = new Set([startNodeId]);
  const cameFrom = new Map();
  const gScore = new Map([[startNodeId, 0]]);
  const fScore = new Map([[startNodeId, euclideanDistance(startNode, endNode)]]);

  while (openSet.size > 0) {
    const current = findLowestFScore(openSet, fScore);

    if (current === endNodeId) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      const tentativeGScore = (gScore.get(current) ?? Infinity) + neighbor.weight;

      if (tentativeGScore >= (gScore.get(neighbor.id) ?? Infinity)) {
        continue;
      }

      cameFrom.set(neighbor.id, current);
      gScore.set(neighbor.id, tentativeGScore);

      const neighborNode = nodeLookup.get(neighbor.id);
      const estimatedScore = tentativeGScore + euclideanDistance(neighborNode, endNode);
      fScore.set(neighbor.id, estimatedScore);
      openSet.add(neighbor.id);
    }
  }

  return null;
}
