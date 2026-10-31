export {
  chooseSchool,
  getCommandContext,
  getSignedIn,
  signIn,
  signOut,
  signOutEverywhere,
} from "./application/sign-in";
export type { SignInError, SignInResult, SignedIn } from "./application/sign-in";
export type { Membership } from "./data/memberships";
export { addMembership, createStaffUser } from "./data/memberships";
export { hashIdentifier, normaliseIdentifier } from "./domain/identifier";
export type { Identifier } from "./domain/identifier";
