import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import StoreMapView from "../components/MapView";
import { fetchNodes, fetchRoute, searchProducts } from "../services/api";

const ENTRANCE_NODE_ID = 1;

function buildGroupedListMarkers(products, nodeLookup) {
  const groupedByNodeId = new Map();

  for (const product of products) {
    const existing = groupedByNodeId.get(product.node_id);

    if (existing) {
      existing.products.push(product.name);
      continue;
    }

    const node = nodeLookup.get(product.node_id);

    if (!node) {
      continue;
    }

    groupedByNodeId.set(product.node_id, {
      node,
      products: [product.name]
    });
  }

  return Array.from(groupedByNodeId.values()).map((item) => ({
    id: `list-node-${item.node.id}`,
    x: item.node.x,
    y: item.node.y,
    label: item.products.join(", "),
    subtitle: item.node.name,
    type: "shopping"
  }));
}

export default function MapScreen({ mapRequest, onBack }) {
  const isListMode = mapRequest?.mode === "list";
  const defaultProduct = isListMode ? null : mapRequest?.product ?? null;
  const defaultShoppingList = isListMode ? mapRequest?.products ?? [] : [];

  const [nodes, setNodes] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaultProduct?.name ?? "");
  const [activeProduct, setActiveProduct] = useState(defaultProduct);
  const [shoppingList] = useState(defaultShoppingList);
  const [showAllShoppingNodes, setShowAllShoppingNodes] = useState(isListMode);
  const [path, setPath] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadNodes() {
      try {
        const loadedNodes = await fetchNodes();

        if (mounted) {
          setNodes(loadedNodes);
        }
      } catch (error) {
        Alert.alert("Request failed", "Could not load map nodes.");
      } finally {
        if (mounted) {
          setLoadingNodes(false);
        }
      }
    }

    loadNodes();

    return () => {
      mounted = false;
    };
  }, []);

  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const entranceNode = nodeLookup.get(ENTRANCE_NODE_ID) ?? null;

  useEffect(() => {
    let mounted = true;

    async function loadRoute() {
      if (!activeProduct || showAllShoppingNodes || nodes.length === 0) {
        setPath([]);
        return;
      }

      setLoadingRoute(true);

      try {
        const route = await fetchRoute(ENTRANCE_NODE_ID, activeProduct.node_id);

        if (mounted) {
          setPath(route.path ?? []);
        }
      } catch (error) {
        if (mounted) {
          setPath([]);
          Alert.alert("Route failed", "Could not calculate a route.");
        }
      } finally {
        if (mounted) {
          setLoadingRoute(false);
        }
      }
    }

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [activeProduct, nodes.length, showAllShoppingNodes]);

  const mapMarkers = useMemo(() => {
    const markers = [];

    if (entranceNode) {
      markers.push({
        id: "entrance",
        x: entranceNode.x,
        y: entranceNode.y,
        label: "Entrance",
        subtitle: entranceNode.name,
        type: "entrance"
      });
    }

    if (showAllShoppingNodes && shoppingList.length > 0) {
      return markers.concat(buildGroupedListMarkers(shoppingList, nodeLookup));
    }

    if (activeProduct) {
      const targetNode = nodeLookup.get(activeProduct.node_id);

      if (targetNode) {
        markers.push({
          id: `active-${activeProduct.id}`,
          x: targetNode.x,
          y: targetNode.y,
          label: activeProduct.name,
          subtitle: targetNode.name,
          type: "target"
        });
      }
    }

    return markers;
  }, [activeProduct, entranceNode, nodeLookup, shoppingList, showAllShoppingNodes]);

  async function handleSearchProduct() {
    const query = searchQuery.trim();

    if (!query) {
      Alert.alert("Missing product", "Type a product name first.");
      return;
    }

    setSearchingProduct(true);

    try {
      const results = await searchProducts(query);

      if (results.length === 0) {
        Alert.alert("No results", "No matching product was found.");
        return;
      }

      setActiveProduct(results[0]);
      setShowAllShoppingNodes(false);
    } catch (error) {
      Alert.alert("Request failed", "Could not search for products.");
    } finally {
      setSearchingProduct(false);
    }
  }

  function handleSelectShoppingItem(product) {
    setActiveProduct(product);
    setSearchQuery(product.name);
    setShowAllShoppingNodes(false);
  }

  function handleShowAllItems() {
    setActiveProduct(null);
    setPath([]);
    setShowAllShoppingNodes(true);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <View style={styles.modePill}>
            <Text style={styles.modePillText}>
              {showAllShoppingNodes ? "Shopping List Mode" : "Single Item Mode"}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>
          {showAllShoppingNodes ? "All selected item nodes" : "Entrance to selected item"}
        </Text>
        <Text style={styles.instructions}>
          Search a new item at any time. The previous node and route are replaced immediately.
        </Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Search on map</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Try cheese, bread, soda..."
          placeholderTextColor="#7c8b83"
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable
          onPress={handleSearchProduct}
          disabled={searchingProduct}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && !searchingProduct ? styles.buttonPressed : null,
            searchingProduct ? styles.buttonDisabled : null
          ]}
        >
          <Text style={styles.searchButtonText}>
            {searchingProduct ? "Updating..." : "Update Map"}
          </Text>
        </Pressable>

        {searchingProduct ? <ActivityIndicator style={styles.loader} color="#1f5c4c" /> : null}
      </View>

      {isListMode ? (
        <View style={styles.listCard}>
          <View style={styles.listCardHeader}>
            <Text style={styles.searchTitle}>Shopping trip items</Text>
            <Pressable onPress={handleShowAllItems} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Show All Nodes</Text>
            </Pressable>
          </View>

          <View style={styles.listGrid}>
            {shoppingList.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => handleSelectShoppingItem(product)}
                style={({ pressed }) => [
                  styles.listChip,
                  pressed ? styles.buttonPressed : null
                ]}
              >
                <Text style={styles.listChipText}>{product.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {loadingNodes ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <StoreMapView
          path={path}
          markers={mapMarkers}
        />
      )}

      {loadingRoute ? <ActivityIndicator style={styles.loader} color="#1f5c4c" /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: "#eef4f0",
    paddingBottom: 28
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: "#2a423a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  backButton: {
    backgroundColor: "#eef5f1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  backButtonText: {
    color: "#21493d",
    fontSize: 14,
    fontWeight: "700"
  },
  modePill: {
    backgroundColor: "#fef1dc",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modePillText: {
    color: "#8a5412",
    fontSize: 12,
    fontWeight: "700"
  },
  label: {
    color: "#1e2b26",
    fontSize: 22,
    fontWeight: "700"
  },
  instructions: {
    color: "#64726b",
    fontSize: 14,
    lineHeight: 20
  },
  searchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 10
  },
  searchTitle: {
    color: "#1e2b26",
    fontSize: 18,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d5dfda",
    backgroundColor: "#f8fbf9",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#10201b"
  },
  searchButton: {
    backgroundColor: "#1f5c4c",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center"
  },
  searchButtonText: {
    color: "#e3f2ec",
    fontSize: 15,
    fontWeight: "700"
  },
  buttonPressed: {
    opacity: 0.9
  },
  buttonDisabled: {
    opacity: 0.55
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 10
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  smallButton: {
    backgroundColor: "#f6ede0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  smallButtonText: {
    color: "#8a5412",
    fontSize: 12,
    fontWeight: "700"
  },
  listGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  listChip: {
    backgroundColor: "#eef5f1",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6e2dc",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  listChipText: {
    color: "#21493d",
    fontSize: 13,
    fontWeight: "700"
  },
  loader: {
    marginTop: 8
  }
});
