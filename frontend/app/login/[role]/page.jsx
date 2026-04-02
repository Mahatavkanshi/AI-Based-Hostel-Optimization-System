import AuthPortal from '../../../src/auth-portal';

export default function LoginRolePage({ params }) {
  return <AuthPortal roleSlug={params.role} mode="login" />;
}
