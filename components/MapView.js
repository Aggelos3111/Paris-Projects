import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Polygon } from "react-native-svg";

const MAP_WIDTH = 1400;
const MAP_HEIGHT = 1376;
const MAP_ASPECT_RATIO = MAP_HEIGHT / MAP_WIDTH;
const STORE_MAP_IMAGE = require("../assets/store_map.png");
const MARKER_SIZE = 16;
const ARROW_HEAD_SIZE = 14;
const ARROW_PADDING = 16;

function getScaledPoint(point, width, height) {
  return {
    x: (point.x / MAP_WIDTH) * width,
    y: (point.y / MAP_HEIGHT) * height
  };
}

function buildArrowSegments(points) {
  const segments = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    if (!length) {
      continue;
    }

    const unitX = deltaX / length;
    const unitY = deltaY / length;
    const shaftStartX = start.x + unitX * ARROW_PADDING;
    const shaftStartY = start.y + unitY * ARROW_PADDING;
    const shaftEndX = end.x - unitX * ARROW_HEAD_SIZE;
    const shaftEndY = end.y - unitY * ARROW_HEAD_SIZE;
    const perpX = -unitY;
    const perpY = unitX;
    const arrowBaseX = end.x - unitX * ARROW_HEAD_SIZE;
    const arrowBaseY = end.y - unitY * ARROW_HEAD_SIZE;

    segments.push({
      key: `${index}-${start.x}-${start.y}-${end.x}-${end.y}`,
      line: {
        x1: shaftStartX,
        y1: shaftStartY,
        x2: shaftEndX,
        y2: shaftEndY
      },
      headPoints: [
        `${end.x},${end.y}`,
        `${arrowBaseX + perpX * (ARROW_HEAD_SIZE * 0.65)},${arrowBaseY + perpY * (ARROW_HEAD_SIZE * 0.65)}`,
        `${arrowBaseX - perpX * (ARROW_HEAD_SIZE * 0.65)},${arrowBaseY - perpY * (ARROW_HEAD_SIZE * 0.65)}`
      ].join(" ")
    });
  }

  return segments;
}

function getMarkerStyles(type) {
  if (type === "entrance") {
    return {
      dot: styles.entranceDot,
      bubble: styles.entranceBubble
    };
  }

  if (type === "shopping") {
    return {
      dot: styles.shoppingDot,
      bubble: styles.shoppingBubble
    };
  }

  return {
    dot: styles.targetDot,
    bubble: styles.targetBubble
  };
}

export default function StoreMapView({ path, markers }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const scaledPathPoints = useMemo(
    () => path.map((point) => getScaledPoint(point, layout.width, layout.height)),
    [path, layout.height, layout.width]
  );

  const scaledMarkers = useMemo(
    () => markers.map((marker) => ({ ...marker, ...getScaledPoint(marker, layout.width, layout.height) })),
    [layout.height, layout.width, markers]
  );

  const arrowSegments = useMemo(
    () => buildArrowSegments(scaledPathPoints),
    [scaledPathPoints]
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.mapContainer}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setLayout({ width, height });
        }}
      >
        <Image
          source={STORE_MAP_IMAGE}
          resizeMode="cover"
          style={styles.mapImage}
        />

        <View pointerEvents="none" style={styles.overlay}>
          <Svg width="100%" height="100%">
            {arrowSegments.map((segment) => (
              <React.Fragment key={segment.key}>
                <Line
                  x1={segment.line.x1}
                  y1={segment.line.y1}
                  x2={segment.line.x2}
                  y2={segment.line.y2}
                  stroke="#ef5b2b"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <Polygon points={segment.headPoints} fill="#ef5b2b" />
              </React.Fragment>
            ))}
          </Svg>
        </View>

        <View pointerEvents="none" style={styles.overlay}>
          {scaledMarkers.map((marker) => {
            const markerStyles = getMarkerStyles(marker.type);

            return (
              <View
                key={marker.id}
                style={[
                  styles.markerContainer,
                  {
                    left: marker.x,
                    top: marker.y
                  }
                ]}
              >
                <View style={[styles.markerDot, markerStyles.dot]} />
                <View style={[styles.markerBubble, markerStyles.bubble]}>
                  <Text style={styles.markerLabel}>{marker.label}</Text>
                  {marker.subtitle ? (
                    <Text style={styles.markerSubtitle}>{marker.subtitle}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.legend}>
        Blue: entrance | Green: selected item | Purple: shopping list nodes | Orange: route arrows
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    gap: 8
  },
  mapContainer: {
    width: "100%",
    aspectRatio: 1 / MAP_ASPECT_RATIO,
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d7e0db",
    backgroundColor: "#ffffff",
    shadowColor: "#29413a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  mapImage: {
    width: "100%",
    height: "100%"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  markerContainer: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -MARKER_SIZE / 2 }, { translateY: -MARKER_SIZE / 2 }]
  },
  markerDot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#20352f",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  entranceDot: {
    backgroundColor: "#2f80ed"
  },
  targetDot: {
    backgroundColor: "#16a34a"
  },
  shoppingDot: {
    backgroundColor: "#9b51e0"
  },
  markerBubble: {
    marginTop: 6,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 88,
    maxWidth: 190,
    borderWidth: 1
  },
  entranceBubble: {
    backgroundColor: "#e8f2ff",
    borderColor: "#b8d4ff"
  },
  targetBubble: {
    backgroundColor: "#e9f8ee",
    borderColor: "#b8e7c5"
  },
  shoppingBubble: {
    backgroundColor: "#f2eaff",
    borderColor: "#d8c2ff"
  },
  markerLabel: {
    color: "#1d2a24",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  markerSubtitle: {
    color: "#5d6d65",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center"
  },
  legend: {
    color: "#5c6e65",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  }
});
