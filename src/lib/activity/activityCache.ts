import type { ActivityLog, RecentlyViewedItem } from '../firebase/types';
/** Account changes invalidate all in-memory activity, including pending previous-account loads. */
export class ActivityCache {
  owner: string | null = null;
  activities: ActivityLog[] = [];
  recentlyViewed: RecentlyViewedItem[] = [];
  switchTo(owner: string | null) {
    if (this.owner === owner) return;
    this.owner = owner; this.activities = []; this.recentlyViewed = [];
  }
  apply(owner: string, activities: ActivityLog[]) {
    if (this.owner !== owner) return false;
    this.activities = activities.filter(item => item.userId === owner);
    return true;
  }
}
