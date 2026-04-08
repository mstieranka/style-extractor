import AnalyticsDashboard from "./AnalyticsDashboard.svelte";
import ChatWidget from "./ChatWidget.svelte";
import CommentBox from "./CommentBox.svelte";
import CookieConsent from "./CookieConsent.svelte";
import EmbedPlayer from "./EmbedPlayer.svelte";
import FeedbackForm from "./FeedbackForm.svelte";
import LoginPrompt from "./LoginPrompt.svelte";
import NewsletterSignup from "./NewsletterSignup.svelte";
import NotificationToast from "./NotificationToast.svelte";
import RatingCard from "./RatingCard.svelte";
import SocialShare from "./SocialShare.svelte";

export const widgets = [
  { name: "AnalyticsDashboard", component: AnalyticsDashboard },
  { name: "ChatWidget", component: ChatWidget },
  { name: "CommentBox", component: CommentBox },
  { name: "CookieConsent", component: CookieConsent },
  { name: "EmbedPlayer", component: EmbedPlayer },
  { name: "FeedbackForm", component: FeedbackForm },
  { name: "LoginPrompt", component: LoginPrompt },
  { name: "NewsletterSignup", component: NewsletterSignup },
  { name: "NotificationToast", component: NotificationToast },
  { name: "RatingCard", component: RatingCard },
  { name: "SocialShare", component: SocialShare },
];
