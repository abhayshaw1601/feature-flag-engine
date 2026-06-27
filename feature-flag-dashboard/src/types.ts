export interface FeatureFlagRule {
    attribute: string;
    operator: 'EQUALS' | 'NOT_EQUALS';
    value: string;
}

export interface FeatureFlag {
    _id: string;
    key: string;
    description?: string;
    isActive: boolean;
    rolloutPercentage: number;
    whitelistedUsers: string[];
    rules: FeatureFlagRule[];
}
