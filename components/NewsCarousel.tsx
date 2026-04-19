import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
} from "react-native";
import { fetchNews, type NewsArticle } from "../src/api/newsApi";

const AUTO_SCROLL_INTERVAL = 5000;
const CARD_WIDTH = 300;

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsCarousel() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const activeIndex = useRef(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(CARD_WIDTH, width * 0.8);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchNews();
        if (!isMounted) return;
        setArticles(response.articles || []);
      } catch (err) {
        if (!isMounted) return;
        setError("Unable to load market news. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!articles.length) return;

    const interval = setInterval(() => {
      activeIndex.current = (activeIndex.current + 1) % articles.length;
      scrollRef.current?.scrollTo({
        x: activeIndex.current * (cardWidth + 16),
        y: 0,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [articles.length, cardWidth]);

  const handleOpen = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      setError("Unable to open news article.");
    }
  };

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color="#0f62fe" />
        <Text style={styles.stateText}>Loading market news…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={[styles.stateText, { color: "#991b1b" }]}>{error}</Text>
      </View>
    );
  }

  if (!articles.length) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>No news available right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={cardWidth + 16}
        decelerationRate="fast"
      >
        {articles.map((article, index) => (
          <TouchableOpacity
            key={`${article.url}-${index}`}
            activeOpacity={0.85}
            onPress={() => handleOpen(article.url)}
            style={[styles.card, { width: cardWidth }]}
          >
            {article.image ? (
              <Image source={{ uri: article.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={3}>
                {article.description}
              </Text>
              <Text style={styles.cardDate}>{formatDate(article.published_at)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  placeholderText: {
    color: "#475569",
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f1724",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 11,
    color: "#64748b",
  },
  stateContainer: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  stateText: {
    marginTop: 8,
    fontSize: 14,
    color: "#334155",
  },
});
