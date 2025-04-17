import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UnauthorizedFeatureMessage from './UnauthorizedFeatureMessage';

/**
 * Component that controls access to features based on user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if user has access
 * @param {String} props.featureName - Name of the feature for display in unauthorized message
 * @param {String} props.featureKey - Key of the feature to check against user permissions
 * @param {String} props.fallbackPath - Path to navigate to if unauthorized (if redirectOnUnauthorized is true)
 * @param {Boolean} props.redirectOnUnauthorized - Whether to redirect or show message on unauthorized
 * @param {Boolean} props.showUpgradeOption - Whether to show upgrade option in unauthorized message
 * @returns {React.ReactNode}
 */
const FeatureAccess = ({
  children,
  featureName,
  featureKey,
  fallbackPath = '/',
  redirectOnUnauthorized = false,
  showUpgradeOption = true
}) => {
  const { user, hasFeatureAccess } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has access to this feature
  const hasAccess = hasFeatureAccess(featureKey);
  
  // If unauthorized and should redirect, do it
  React.useEffect(() => {
    if (!hasAccess && redirectOnUnauthorized) {
      navigate(fallbackPath);
    }
  }, [hasAccess, redirectOnUnauthorized, navigate, fallbackPath]);
  
  // If user has access, render children
  if (hasAccess) {
    return children;
  }
  
  // If not redirecting, show unauthorized message
  return (
    <UnauthorizedFeatureMessage 
      featureName={featureName}
      returnPath={fallbackPath}
      showUpgradeOption={showUpgradeOption}
    />
  );
};

export default FeatureAccess; 