import nodes from "../data/nodes.json";
import edges from "../data/edges.json";
import products from "../data/products.json";
import findPath from "../utils/astar";

const localNodes = nodes;
const localEdges = edges;
const localProducts = products;
const nodeLookup = new Map(localNodes.map((node) => [node.id, node]));

function cloneArray(data) {
  return data.map((item) => ({ ...item }));
}

export async function fetchProducts() {
  return cloneArray(localProducts);
}

export async function searchProducts(query) {
  const normalizedQuery = (query || "").trim().toLowerCase();

  if (!normalizedQuery) {
    return cloneArray(localProducts);
  }

  return localProducts
    .filter((product) => product.name.toLowerCase().includes(normalizedQuery))
    .map((product) => ({ ...product }));
}

export async function fetchNodes() {
  return cloneArray(localNodes);
}

export async function fetchRoute(startNode, endNode) {
  if (typeof startNode !== "number" || typeof endNode !== "number") {
    throw new Error("start_node and end_node must be numbers");
  }

  const pathNodeIds = findPath(localNodes, localEdges, startNode, endNode);

  if (!pathNodeIds) {
    throw new Error("No route found");
  }

  const path = pathNodeIds.map((nodeId) => {
    const node = nodeLookup.get(nodeId);
    return { x: node.x, y: node.y };
  });

  return { path };
}
