"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import ServicesAdminClient from "./ServicesAdminClient";

export default function ServicesTab() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [catsRes, servsRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/services")
      ]);
      if (catsRes.ok && servsRes.ok) {
        const cats = await catsRes.json();
        const servs = await servsRes.json();
        setCategories(cats);
        setServices(servs);
      } else {
        showToast("Failed to load services data.", "error");
      }
    } catch (err) {
      showToast("Failed to fetch services data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <ServicesAdminClient initialCategories={categories} initialServices={services} />;
}
