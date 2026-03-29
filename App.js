import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";

export default function App() {
  const [mapRequest, setMapRequest] = useState(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {mapRequest ? (
          <MapScreen
            mapRequest={mapRequest}
            onBack={() => setMapRequest(null)}
          />
        ) : (
          <HomeScreen
            onOpenSingleRoute={(product) =>
              setMapRequest({
                mode: "single",
                product
              })
            }
            onOpenShoppingTrip={(products) =>
              setMapRequest({
                mode: "list",
                products
              })
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef4f0"
  },
  container: {
    flex: 1
  }
});
