import portrait from "@frontend/public/images/portrait.png";
import otrHero from "@frontend/public/images/off-the-rack/hero.png";
import otrHome from "@frontend/public/images/off-the-rack/home.jpg";
import otrShop from "@frontend/public/images/off-the-rack/shop.jpg";
import otrProduct from "@frontend/public/images/off-the-rack/product.jpg";
import otrAdmin from "@frontend/public/images/off-the-rack/admin.jpg";
import otrWireframe from "@frontend/public/images/off-the-rack/wireframe.png";
import otrInquiryWireframe from "@frontend/public/images/off-the-rack/inquiry-wireframe.png";
import otrInquiry from "@frontend/public/images/off-the-rack/inquiry.jpg";
import marciHero from "@frontend/public/images/marci/hero.png";
import marciHome from "@frontend/public/images/marci/homepage.png";
import marciDetail from "@frontend/public/images/marci/homepage-detail.png";
import gcsHero from "@frontend/public/images/ground-control-station/hero.png";
import gcsDashboard from "@frontend/public/images/ground-control-station/dashboard.png";
import gcsAnalytics from "@frontend/public/images/ground-control-station/analytics.png";
import gcsStream from "@frontend/public/images/ground-control-station/stream.png";
import gcsMobile from "@frontend/public/images/ground-control-station/mobile-dashboard.png";
import riftboundHero from "@frontend/public/images/riftbound/hero.png";
import riftboundHome from "@frontend/public/images/riftbound/home.png";
import riftboundHeroes from "@frontend/public/images/riftbound/heroes.png";
import riftboundEquipment from "@frontend/public/images/riftbound/equipment.png";
import riftboundBattle from "@frontend/public/images/riftbound/battle.png";
import taskMateWireframe from "@frontend/public/images/task-mate/wireframe.jpg";
import studyBuddiesFlowchart from "@frontend/public/images/study-buddies/flowchart.jpg";
import dropsafeFlowchart from "@frontend/public/images/dropsafe/flowchart.jpg";
import messagingUseCases from "@frontend/public/images/e-registered-messaging-system/use-cases.jpg";
import messagingSenderFlow from "@frontend/public/images/e-registered-messaging-system/sender-verification.jpg";
import messagingCampaignFlow from "@frontend/public/images/e-registered-messaging-system/campaign-flow.jpg";
import messagingMessageFlow from "@frontend/public/images/e-registered-messaging-system/message-flow.jpg";

const assets = {
  "/images/portrait.png": portrait,
  "/images/off-the-rack/hero.png": otrHero,
  "/images/off-the-rack/home.jpg": otrHome,
  "/images/off-the-rack/shop.jpg": otrShop,
  "/images/off-the-rack/product.jpg": otrProduct,
  "/images/off-the-rack/admin.jpg": otrAdmin,
  "/images/off-the-rack/wireframe.png": otrWireframe,
  "/images/off-the-rack/inquiry-wireframe.png": otrInquiryWireframe,
  "/images/off-the-rack/inquiry.jpg": otrInquiry,
  "/images/marci/hero.png": marciHero,
  "/images/marci/homepage.png": marciHome,
  "/images/marci/homepage-detail.png": marciDetail,
  "/images/ground-control-station/hero.png": gcsHero,
  "/images/ground-control-station/dashboard.png": gcsDashboard,
  "/images/ground-control-station/analytics.png": gcsAnalytics,
  "/images/ground-control-station/stream.png": gcsStream,
  "/images/ground-control-station/mobile-dashboard.png": gcsMobile,
  "/images/riftbound/hero.png": riftboundHero,
  "/images/riftbound/home.png": riftboundHome,
  "/images/riftbound/heroes.png": riftboundHeroes,
  "/images/riftbound/equipment.png": riftboundEquipment,
  "/images/riftbound/battle.png": riftboundBattle,
  "/images/task-mate/wireframe.jpg": taskMateWireframe,
  "/images/study-buddies/flowchart.jpg": studyBuddiesFlowchart,
  "/images/dropsafe/flowchart.jpg": dropsafeFlowchart,
  "/images/e-registered-messaging-system/use-cases.jpg": messagingUseCases,
  "/images/e-registered-messaging-system/sender-verification.jpg": messagingSenderFlow,
  "/images/e-registered-messaging-system/campaign-flow.jpg": messagingCampaignFlow,
  "/images/e-registered-messaging-system/message-flow.jpg": messagingMessageFlow,
};

export function imageDimensions(path: string) {
  const asset = assets[path as keyof typeof assets];
  return asset ? { width: asset.width, height: asset.height } : { width: 1600, height: 1000 };
}
