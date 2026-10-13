import portrait from "@/public/images/portrait.png";
import otrHero from "@/public/images/off-the-rack/hero.png";
import otrHome from "@/public/images/off-the-rack/home.jpg";
import otrShop from "@/public/images/off-the-rack/shop.jpg";
import otrProduct from "@/public/images/off-the-rack/product.jpg";
import otrAdmin from "@/public/images/off-the-rack/admin.jpg";
import otrWireframe from "@/public/images/off-the-rack/wireframe.png";
import marciHero from "@/public/images/marci/hero.png";
import marciHome from "@/public/images/marci/homepage.png";
import marciDetail from "@/public/images/marci/homepage-detail.png";

const assets = {
  "/images/portrait.png": portrait,
  "/images/off-the-rack/hero.png": otrHero,
  "/images/off-the-rack/home.jpg": otrHome,
  "/images/off-the-rack/shop.jpg": otrShop,
  "/images/off-the-rack/product.jpg": otrProduct,
  "/images/off-the-rack/admin.jpg": otrAdmin,
  "/images/off-the-rack/wireframe.png": otrWireframe,
  "/images/marci/hero.png": marciHero,
  "/images/marci/homepage.png": marciHome,
  "/images/marci/homepage-detail.png": marciDetail,
};

export function imageDimensions(path: string) {
  const asset = assets[path as keyof typeof assets];
  return asset ? { width: asset.width, height: asset.height } : { width: 1600, height: 1000 };
}
