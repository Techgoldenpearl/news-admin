"use client";

import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/editor/ArticleForm";

export default function EditArticlePage() {
  const { id } = useParams();
  return <ArticleForm articleId={parseInt(id as string)} />;
}
