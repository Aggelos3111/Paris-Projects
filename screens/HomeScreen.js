import React, { useEffect, useState } from "react";
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

import { fetchProducts, searchProducts } from "../services/api";

export default function HomeScreen({ onOpenSingleRoute, onOpenShoppingTrip }) {
  const [query, setQuery] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await fetchProducts();

        if (mounted) {
          setProducts(loadedProducts);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert("Request failed", "Could not load the product list.");
        }
      } finally {
        if (mounted) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  async function findProductByQuery(forcedQuery) {
    const trimmedQuery = (forcedQuery ?? query).trim();

    if (!trimmedQuery) {
      Alert.alert("Missing product", "Type a product name first.");
      return null;
    }

    try {
      const matchingProducts = await searchProducts(trimmedQuery);

      if (matchingProducts.length === 0) {
        Alert.alert("No results", "No matching product was found.");
        return null;
      }

      return matchingProducts[0];
    } catch (error) {
      Alert.alert("Request failed", "Could not load products.");
      return null;
    }
  }

  async function handleOpenSingleRoute(forcedQuery) {
    setBusyAction("route");
    const product = await findProductByQuery(forcedQuery);
    setBusyAction(null);

    if (product) {
      onOpenSingleRoute(product);
    }
  }

  async function handleAddToList(forcedQuery) {
    setBusyAction("add");
    const product = await findProductByQuery(forcedQuery);
    setBusyAction(null);

    if (!product) {
      return;
    }

    const exists = shoppingList.some((item) => item.id === product.id);

    if (exists) {
      Alert.alert("Already added", `${product.name} is already in your shopping list.`);
      return;
    }

    setShoppingList((current) => [...current, product]);
    setQuery("");
  }

  function handleRemoveFromList(productId) {
    setShoppingList((current) => current.filter((item) => item.id !== productId));
  }

  function handleAcceptAll() {
    if (shoppingList.length === 0) {
      Alert.alert("List is empty", "Add at least one product before continuing.");
      return;
    }

    onOpenShoppingTrip(shoppingList);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Indoor Retail Navigation</Text>
        <Text style={styles.title}>Smart Store Route Planner</Text>
        <Text style={styles.subtitle}>
          Build a shopping run from the entrance and jump between items instantly on the map.
        </Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Find Or Add Product</Text>
        <TextInput
          placeholder="Try bread, beef, soda, or eggs"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#7c8b83"
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => handleOpenSingleRoute()}
            disabled={busyAction !== null}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.routeButton,
              pressed && busyAction === null ? styles.primaryButtonPressed : null,
              busyAction !== null ? styles.primaryButtonDisabled : null
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {busyAction === "route" ? "Opening..." : "Route Now"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleAddToList()}
            disabled={busyAction !== null}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.listButton,
              pressed && busyAction === null ? styles.primaryButtonPressed : null,
              busyAction !== null ? styles.primaryButtonDisabled : null
            ]}
          >
            <Text style={styles.listButtonText}>
              {busyAction === "add" ? "Adding..." : "Add To List"}
            </Text>
          </Pressable>
        </View>

        {busyAction ? <ActivityIndicator style={styles.loader} color="#1f5c4c" /> : null}
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Shopping List</Text>
        <Text style={styles.helperText}>
          Add everything you need, then use Accept All to show all selected item nodes on the map.
        </Text>

        {shoppingList.length === 0 ? (
          <Text style={styles.emptyText}>No products added yet.</Text>
        ) : (
          <View style={styles.productGrid}>
            {shoppingList.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => handleRemoveFromList(product.id)}
                style={({ pressed }) => [
                  styles.listChip,
                  pressed ? styles.productChipPressed : null
                ]}
              >
                <Text style={styles.productChipText}>
                  {product.name} x
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleAcceptAll}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.acceptButton,
            pressed ? styles.primaryButtonPressed : null
          ]}
        >
          <Text style={styles.acceptButtonText}>Accept All</Text>
        </Pressable>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Available Products</Text>
        <Text style={styles.helperText}>
          Products are mapped to bakery, meat, dairy, produce, frozen, deli, bulk, seafood, wine, grocery, and florist sections.
        </Text>

        {loadingProducts ? (
          <ActivityIndicator style={styles.loader} color="#1f5c4c" />
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => setQuery(product.name)}
                style={({ pressed }) => [
                  styles.productChip,
                  pressed ? styles.productChipPressed : null
                ]}
              >
                <Text style={styles.productChipText}>{product.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 18,
    justifyContent: "center"
  },
  heroCard: {
    backgroundColor: "#1f5c4c",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#163d33",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  eyebrow: {
    color: "#cde6d8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 10
  },
  subtitle: {
    color: "#d9efe5",
    fontSize: 15,
    lineHeight: 22
  },
  searchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    gap: 14,
    shadowColor: "#2a423a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    gap: 12,
    shadowColor: "#2a423a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  sectionTitle: {
    color: "#1e2b26",
    fontSize: 20,
    fontWeight: "700"
  },
  helperText: {
    color: "#64726b",
    fontSize: 14,
    lineHeight: 20
  },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#d5dfda",
    backgroundColor: "#f8fbf9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#10201b"
  },
  primaryButton: {
    backgroundColor: "#f3a43b",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  routeButton: {
    flex: 1
  },
  listButton: {
    flex: 1,
    backgroundColor: "#1f5c4c"
  },
  listButtonText: {
    color: "#e3f2ec",
    fontSize: 16,
    fontWeight: "700"
  },
  primaryButtonPressed: {
    opacity: 0.9
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#2f1d03",
    fontSize: 16,
    fontWeight: "700"
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  listChip: {
    backgroundColor: "#f6ede0",
    borderWidth: 1,
    borderColor: "#ead8b9",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  productChip: {
    backgroundColor: "#eef5f1",
    borderWidth: 1,
    borderColor: "#d6e2dc",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  productChipPressed: {
    backgroundColor: "#ddece4"
  },
  productChipText: {
    color: "#21493d",
    fontSize: 14,
    fontWeight: "600"
  },
  acceptButton: {
    backgroundColor: "#ef5b2b",
    marginTop: 4
  },
  acceptButtonText: {
    color: "#fff7f3",
    fontSize: 16,
    fontWeight: "700"
  },
  emptyText: {
    color: "#73857d",
    fontSize: 14
  },
  loader: {
    marginTop: 12
  }
});
