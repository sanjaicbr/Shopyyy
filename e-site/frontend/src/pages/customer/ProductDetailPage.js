import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiShare2, FiTruck, FiRefreshCw } from 'react-icons/fi';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getById(id);
      setProduct(response.data.product);
      if (response.data.product.variants?.length > 0) {
        const firstVariant = response.data.product.variants[0];
        setSelectedVariant(firstVariant);
        setSelectedSize(firstVariant.size);
        setSelectedColor(firstVariant.color);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const variant = product.variants.find(v => v.size === size && v.color === selectedColor) ||
      product.variants.find(v => v.size === size);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedColor(variant.color);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const variant = product.variants.find(v => v.color === color && v.size === selectedSize) ||
      product.variants.find(v => v.color === color);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedSize(variant.size);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.variant_id, quantity);
      alert('Added to cart!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="bg-gray-200 rounded-2xl h-96"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-gray-500">Product not found.</div>;
  }

  const uniqueSizes = [...new Set(product.variants.map(v => v.size))];
  const uniqueColors = [...new Set(product.variants.map(v => v.color))];
  const discount = selectedVariant?.mrp && selectedVariant.mrp > selectedVariant.selling_price
    ? Math.round(((selectedVariant.mrp - selectedVariant.selling_price) / selectedVariant.mrp) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-gray-100 mb-4">
            <img
              src={product.images?.[mainImage] || 'https://via.placeholder.com/600x700?text=CBR+Collections'}
              alt={product.title}
              className="w-full h-[500px] object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${mainImage === i ? 'border-primary-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{product.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.department} • {product.category}</p>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary-700">₹{selectedVariant?.selling_price}</span>
            {selectedVariant?.mrp && selectedVariant.mrp > selectedVariant.selling_price && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{selectedVariant.mrp}</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Size Selection */}
          {uniqueSizes.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map(size => (
                  <button key={size} onClick={() => handleSizeSelect(size)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${selectedSize === size ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-400'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {uniqueColors.length > 0 && uniqueColors[0] && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Color: <span className="text-gray-500">{selectedColor}</span></h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map(color => (
                  <button key={color} onClick={() => handleColorSelect(color)}
                    className={`px-4 py-2 rounded-lg border text-sm ${selectedColor === color ? 'bg-primary-100 border-primary-500 text-primary-700' : 'border-gray-300 text-gray-700 hover:border-primary-400'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Quantity</h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded border flex items-center justify-center text-lg">-</button>
              <span className="font-medium text-lg">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded border flex items-center justify-center text-lg">+</button>
            </div>
            {selectedVariant && (
              <p className="text-sm text-gray-400 mt-1">
                {selectedVariant.stock_quantity > 0 ? `${selectedVariant.stock_quantity} in stock` : 'Out of stock'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock_quantity <= 0}
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
              <FiShoppingCart /> Add to Cart
            </button>
            <button className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-red-300 transition">
              <FiHeart className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Info */}
          <div className="border-t pt-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiTruck className="text-primary-500" /> Free delivery on orders above ₹999
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiRefreshCw className="text-primary-500" /> 7-day easy returns
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t pt-5">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="border-t pt-5">
            <h3 className="font-semibold text-gray-700 mb-2">Product Details</h3>
            <table className="text-sm text-gray-600 w-full">
              <tbody>
                {product.fabric_material && <tr><td className="py-1 font-medium w-32">Fabric</td><td>{product.fabric_material}</td></tr>}
                {product.brand && <tr><td className="py-1 font-medium">Brand</td><td>{product.brand}</td></tr>}
                {product.seasonal_tag && <tr><td className="py-1 font-medium">Collection</td><td>{product.seasonal_tag}</td></tr>}
                {selectedVariant?.sku_code && <tr><td className="py-1 font-medium">SKU</td><td>{selectedVariant.sku_code}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
