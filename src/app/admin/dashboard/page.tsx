"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, getAllProducts, addProduct, addProductsBulk, deleteProduct, updateProduct, type Product } from "@/lib/firebase/products";
import { toast } from "react-hot-toast";
import { 
  Upload, 
  Plus, 
  Trash2, 
  Package, 
  FileJson, 
  Loader2,
  LogOut,
  Download,
  DollarSign,
  Tag,
  ShoppingBag,
  Edit,
  BarChart3,
  TrendingUp,
  Eye
} from "lucide-react";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "analytics">("products");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUploadJson, setShowUploadJson] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "",
    brand: "",
    colors: "",
    sizes: "",
  });

  // Fix for GPM WebView - Reset file input on click to ensure gallery opens every time
  useEffect(() => {
    const jsonInput = document.querySelector('input[type="file"][accept=".json"]');
    if (jsonInput) {
      const handleInputClick = () => {
        (jsonInput as HTMLInputElement).value = "";
      };
      jsonInput.addEventListener("click", handleInputClick);
      return () => {
        jsonInput.removeEventListener("click", handleInputClick);
      };
    }
  }, []);

  useEffect(() => {
    // Check admin access
    if (!user) {
      router.push("/admin/login");
      return;
    }

    if (!isAdmin(user.email)) {
      toast.error("Access denied. Admin only.");
      router.push("/");
      return;
    }

    loadProducts();
  }, [user, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "",
      category: "",
      brand: "",
      colors: "",
      sizes: "",
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image || !formData.category) {
      toast.error("Name, image, and category are required");
      return;
    }

    try {
      setUploading(true);

      await addProduct({
        name: formData.name,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : undefined,
        image: formData.image,
        category: formData.category,
        brand: formData.brand,
        colors: formData.colors ? formData.colors.split(",").map(c => c.trim()) : [],
        sizes: formData.sizes ? formData.sizes.split(",").map(s => s.trim()) : [],
      });

      toast.success("Product added successfully!");
      setShowAddForm(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct || !formData.name || !formData.image || !formData.category) {
      toast.error("Name, image, and category are required");
      return;
    }

    try {
      setUploading(true);

      await updateProduct(editingProduct.id, {
        name: formData.name,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : undefined,
        image: formData.image,
        category: formData.category,
        brand: formData.brand,
        colors: formData.colors ? formData.colors.split(",").map(c => c.trim()) : [],
        sizes: formData.sizes ? formData.sizes.split(",").map(s => s.trim()) : [],
      });

      toast.success("Product updated successfully!");
      setShowEditForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setUploading(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price?.toString() || "",
      image: product.image,
      category: product.category,
      brand: product.brand || "",
      colors: product.colors?.join(", ") || "",
      sizes: product.sizes?.join(", ") || "",
    });
    setShowEditForm(true);
    setShowAddForm(false);
    setShowUploadJson(false);
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of products");
      }

      const count = await addProductsBulk(data);
      toast.success(`Successfully added ${count} products!`);
      setShowUploadJson(false);
      loadProducts();
    } catch (error: any) {
      console.error("Error uploading JSON:", error);
      toast.error(error.message || "Invalid JSON file");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"?`)) return;

    try {
      await deleteProduct(productId);
      toast.success("Product deleted");
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const downloadSampleJson = () => {
    const sampleData = [
      {
        name: "Classic White T-Shirt",
        description: "Premium cotton t-shirt",
        price: 29.99,
        image: "/v1.jpg",
        category: "Men",
        brand: "Fashion Co",
        colors: ["White", "Black", "Gray"],
        sizes: ["S", "M", "L", "XL"],
        inStock: true
      },
      {
        name: "Slim Fit Jeans",
        description: "Comfortable denim jeans",
        price: 79.99,
        image: "/v2.jpg",
        category: "Women",
        brand: "Denim Plus",
        colors: ["Blue", "Black"],
        sizes: ["28", "30", "32", "34"],
        inStock: true
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-products.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate analytics
  const analytics = {
    totalProducts: products.length,
    categories: [...new Set(products.map(p => p.category))].length,
    totalValue: products.reduce((sum, p) => sum + (p.price || 0), 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0,
    recentlyAdded: products.filter(p => {
      const createdAt = p.createdAt?.toDate?.() || new Date(0);
      const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length,
    categoryBreakdown: products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-md">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-800">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Manage products</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/admin/login");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Compact Navigation Tabs */}
          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => {
                setActiveTab("products");
                setShowAddForm(false);
                setShowEditForm(false);
                setShowUploadJson(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === "products"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Products
            </button>
            <button
              onClick={() => {
                setActiveTab("analytics");
                setShowAddForm(false);
                setShowEditForm(false);
                setShowUploadJson(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-4">
        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-1">
                  <Package className="w-5 h-5 text-blue-600" />
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">{analytics.totalProducts}</p>
                <p className="text-xs text-gray-500">Total Products</p>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-1">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">{analytics.categories}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-1">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">
                  ${analytics.totalValue.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>

              <div className="bg-white rounded-lg p-3 shadow-sm border">
                <div className="flex items-center justify-between mb-1">
                  <Upload className="w-5 h-5 text-orange-600" />
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                    7 days
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800">{analytics.recentlyAdded}</p>
                <p className="text-xs text-gray-500">Recent</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Category Distribution
              </h3>
              {Object.keys(analytics.categoryBreakdown).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
                    const percentage = (count / analytics.totalProducts) * 100;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {category}
                          </span>
                          <span className="text-xs text-gray-600">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
              )}
            </div>

            {/* Quick Action */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">
                Switch to Products to manage inventory
              </p>
              <button
                onClick={() => setActiveTab("products")}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition"
              >
                Go to Products
              </button>
            </div>
          </div>
        )}

        {/* Manage Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Compact Action Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowEditForm(false);
                  setShowUploadJson(false);
                  resetForm();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>

              <button
                onClick={() => {
                  setShowUploadJson(!showUploadJson);
                  setShowAddForm(false);
                  setShowEditForm(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload JSON
              </button>

              <button
                onClick={downloadSampleJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Sample
              </button>
            </div>

            {/* Compact Add Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg p-3 shadow-sm border mb-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Add New Product
                </h3>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Image URL *"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category *</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Colors (comma separated)"
                    value={formData.colors}
                    onChange={(e) => setFormData({...formData, colors: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Sizes (comma separated)"
                    value={formData.sizes}
                    onChange={(e) => setFormData({...formData, sizes: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 md:col-span-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-blue-600 text-white py-1.5 text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? "Adding..." : "Add Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 bg-gray-200 text-gray-700 py-1.5 text-xs rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Compact Edit Form */}
            {showEditForm && editingProduct && (
              <div className="bg-white rounded-lg p-3 shadow-sm border mb-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Edit Product
                </h3>
                <form onSubmit={handleEditProduct} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Image URL *"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category *</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Colors (comma separated)"
                    value={formData.colors}
                    onChange={(e) => setFormData({...formData, colors: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Sizes (comma separated)"
                    value={formData.sizes}
                    onChange={(e) => setFormData({...formData, sizes: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border rounded-md px-2.5 py-1.5 md:col-span-2 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-blue-600 text-white py-1.5 text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? "Updating..." : "Update Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      className="px-4 bg-gray-200 text-gray-700 py-1.5 text-xs rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Compact Upload JSON */}
            {showUploadJson && (
              <div className="bg-white rounded-lg p-3 shadow-sm border mb-3">
                <h3 className="text-sm font-semibold mb-2">Upload Products JSON</h3>
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-400 transition">
                    <FileJson className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Choose JSON file
                      </span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleJsonUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload product data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUploadJson(false)}
                    className="w-full bg-gray-200 text-gray-700 py-1.5 text-xs rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Compact Products Grid */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold">All Products ({products.length})</h3>
              </div>
              
              {products.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">No products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-md p-2 hover:shadow-md transition">
                      <div className="relative aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h4 className="text-xs font-semibold text-gray-800 mb-0.5 truncate">{product.name}</h4>
                      <p className="text-[10px] text-gray-500 mb-1">{product.category}</p>
                      {product.price && (
                        <p className="text-sm font-bold text-blue-600 mb-2">${product.price}</p>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditProduct(product)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] hover:bg-blue-100 transition"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
