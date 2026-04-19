import axios from "axios";
import { API_BASE_URL } from "../config";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  published_at: string;
}

export interface NewsResponse {
  status: string;
  query: string;
  articles: NewsArticle[];
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export async function fetchNews(
  sector?: string,
  keyword?: string,
  industry?: string
): Promise<NewsResponse> {
  const params: Record<string, string> = {};
  if (sector) params.sector = sector;
  if (keyword) params.keyword = keyword;
  if (industry) params.industry = industry;

  const response = await client.get<NewsResponse>("/news", {
    params,
  });

  return response.data;
}
