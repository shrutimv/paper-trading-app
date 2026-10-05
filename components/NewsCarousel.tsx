// components/NewsCarousel.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchNews, type NewsArticle } from "../src/api/newsApi";
import { useTheme } from "../context/ThemeContext";

const CATEGORIES = [
  { label: "General", value: "General", sector: undefined, keyword: undefined },
  { label: "Tech", value: "Tech", sector: "Technology", keyword: undefined },
  { label: "Finance", value: "Finance", sector: "Finance", keyword: undefined },
  { label: "Energy", value: "Energy", sector: undefined, keyword: "Energy" },
  { label: "Automobile", value: "Automobile", sector: undefined, keyword: "Automobile" },
  { label: "IPOs", value: "IPOs", sector: undefined, keyword: "IPO" },
];

const AUTO_SCROLL_INTERVAL = 6000;
const CARD_WIDTH = 300;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style: any;
  highlightStyle?: any;
}) {
  if (!query || !query.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const parts = text.split(new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi"));

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === normalizedQuery;
        return (
          <Text
            key={i}
            style={isMatch ? [style, { fontWeight: "800", color: "#2563eb", backgroundColor: "rgba(37, 99, 235, 0.08)" }, highlightStyle] : style}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NewsSkeleton({ cardWidth }: { cardWidth: number }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const shimmerBg = isDark ? "#1E293B" : "#E2E8F0";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {[1, 2, 3].map((key) => (
        <Animated.View
          key={key}
          style={[
            styles.card,
            { width: cardWidth, opacity: pulseAnim, minHeight: 310 }
          ]}
        >
          <View style={[styles.image, { backgroundColor: shimmerBg }]} />
          <View style={styles.cardBody}>
            <View style={{ height: 16, backgroundColor: shimmerBg, borderRadius: 4, marginBottom: 8, width: "90%" }} />
            <View style={{ height: 12, backgroundColor: shimmerBg, borderRadius: 4, marginBottom: 8, width: "100%" }} />
            <View style={{ height: 12, backgroundColor: shimmerBg, borderRadius: 4, marginBottom: 12, width: "80%" }} />
            <View style={{ height: 10, backgroundColor: shimmerBg, borderRadius: 4, width: "30%" }} />
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

export default function NewsCarousel() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputQuery, setInputQuery] = useState("");

  const scrollRef = useRef<ScrollView | null>(null);
  const activeIndex = useRef(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(CARD_WIDTH, width * 0.85);

  const loadNews = async (catVal: string, searchVal: string) => {
    setLoading(true);
    setError(null);
    try {
      let sector: string | undefined = undefined;
      let keyword: string | undefined = undefined;

      if (searchVal.trim().length > 0) {
        keyword = searchVal.trim();
      } else {
        const cat = CATEGORIES.find((c) => c.value === catVal);
        if (cat) {
          sector = cat.sector;
          keyword = cat.keyword;
        }
      }

      const response = await fetchNews(sector, keyword);
      setArticles(response.articles || []);
      
      // Reset scroll position to the first card
      activeIndex.current = 0;
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } catch {
      setError("Unable to load market news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

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

  const handleSearchSubmit = () => {
    if (inputQuery.trim().length > 0) {
      setSelectedCategory("");
      setSearchQuery(inputQuery);
    } else {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setInputQuery("");
    setSearchQuery("");
    setSelectedCategory("General");
  };

  const handleCategoryPress = (value: string) => {
    setInputQuery("");
    setSearchQuery("");
    setSelectedCategory(value);
  };

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

  const activeKeyword = searchQuery || CATEGORIES.find(c => c.value === selectedCategory)?.keyword || "";
  const qLower = activeKeyword.toLowerCase().trim();
  const hasDirectMatch = activeKeyword ? articles.some(
    (article) =>
      article.title.toLowerCase().includes(qLower) ||
      article.description.toLowerCase().includes(qLower)
  ) : true;

  const renderHeader = () => (
    <View>
      {/* Search Input Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search market news by keywords..."
          placeholderTextColor={colors.textSecondary}
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {(inputQuery.length > 0 || searchQuery.length > 0) && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
        style={styles.chipsScrollView}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value && searchQuery === "";
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => handleCategoryPress(cat.value)}
              style={[
                styles.chip,
                isActive ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Direct Match Warning Banner */}
      {activeKeyword !== "" && !hasDirectMatch && articles.length > 0 && (
        <View style={styles.noMatchBanner}>
          <Ionicons name="information-circle-outline" size={16} color={isDark ? "#fbbf24" : "#b45309"} style={{ marginRight: 6 }} />
          <Text style={styles.noMatchBannerText}>
            {searchQuery 
              ? `No direct matches found for "${searchQuery}". Showing related market news.`
              : `Showing related news for ${selectedCategory}.`
            }
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <NewsSkeleton cardWidth={cardWidth} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.stateContainer}>
          <Text style={[styles.stateText, { color: "#b91c1c" }]}>{error}</Text>
          <TouchableOpacity onPress={handleClearSearch} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Retry News</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!articles.length) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.stateContainer}>
          <Ionicons name="newspaper-outline" size={44} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={styles.stateText}>No articles found matching your criteria.</Text>
          <TouchableOpacity onPress={handleClearSearch} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
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
              <HighlightedText
                text={article.title}
                query={activeKeyword}
                style={styles.cardTitle}
                highlightStyle={{ backgroundColor: "rgba(37, 99, 235, 0.12)" }}
              />
              <HighlightedText
                text={article.description}
                query={activeKeyword}
                style={styles.cardDescription}
                highlightStyle={{ backgroundColor: "rgba(37, 99, 235, 0.12)" }}
              />
              <Text style={styles.cardDate}>{formatDate(article.published_at)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  cardBody: {
    padding: 16,
    minHeight: 150,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stateContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    height: "100%",
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
  },
  chipsScrollView: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chipsContent: {
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  chipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  resetBtn: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  resetBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  noMatchBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    backgroundColor: isDark ? "rgba(217, 119, 6, 0.1)" : "#fef3c7",
    borderColor: isDark ? "rgba(217, 119, 6, 0.2)" : "#fde68a",
  },
  noMatchBannerText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    color: isDark ? "#fbbf24" : "#b45309",
  },
});
