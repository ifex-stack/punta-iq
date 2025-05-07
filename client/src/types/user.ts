/**
 * User response interface
 * Matches the User type from the server schema with any necessary client-side additions
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'analyst';
  createdAt: string;
  isEmailVerified?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: string | null;
  onboardingStatus?: 'not_started' | 'in_progress' | 'completed';
  points?: number;
  referralCode?: string;
  avatarUrl?: string | null;
}