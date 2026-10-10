import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  Collection,
  ContentItem,
  ProfileData,
  SavedPage,
} from '../../core/models/api.models';
import { SharingService } from '../../services/sharing.service';
import { UserService } from '../../services/user.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: ProfileData | null = null;
  content: ContentItem[] = [];
  saved: SavedPage = { page: 1, limit: 50, items: [], hasMore: false };
  collections: Collection[] = [];

  activeTab: 'posts' | 'reels' | 'saved' = 'posts';
  isOwner = false;
  loading = true;
  followLoading = false;
  collectionName = '';
  collectionLoading = false;
  showCollectionForm = false;
  deletingCollectionId: string | null = null;
  editing = false;
  selectedContent?: ContentItem;
  selectedCollection: Collection | null = null;
  showAddSavedItems = false;
  selectedSavedIds: string[] = [];
  savingCollectionItems = false;
  removingCollectionItemId: string | null = null;
  collectionActionError = '';
  collectionItemsLoading = false;
  collectionItemsError = '';
  unavailableCollectionItemsCount = 0;
  loadedCollectionItems: ContentItem[] = [];
  loadingAddSavedItems = false;
  loadingMoreSavedItems = false;

  private readonly previewMap = new Map<string, ContentItem[]>();
  private profileId = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly sharing: SharingService,
    private readonly cdr: ChangeDetectorRef,
    private readonly socket: SocketService,
  ) {}

  ngOnInit(): void {
    this.sharing.currentSaved
      .pipe(takeUntil(this.destroy$))
      .subscribe((saved) => {
        this.saved = saved;
        this.rebuildCollectionPreviews();
        this.cdr.markForCheck();
      });

    this.sharing.currentUserData
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.collections = user?.collections ?? [];
        this.rebuildCollectionPreviews();
        this.isOwner = Boolean(
          user?._id &&
          this.profileId &&
          String(user._id) === this.profileId,
        );
        this.cdr.markForCheck();
      });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.profileId = params.get('id') || '';
          this.loading = true;
          this.editing = false;
          this.activeTab = 'posts';
          this.selectedContent = undefined;
          this.selectedCollection = null;
          this.loadedCollectionItems = [];
          this.collectionItemsLoading = false;
          this.collectionItemsError = '';
          this.collectionActionError = '';
          this.cdr.markForCheck();
          return this.userService.getProfilesData(this.profileId);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.profile = response.data.profile;
            this.content = response.data.allPosts ?? [];
            this.isOwner =
              String(this.sharing.currentUser?._id) ===
              String(this.profile?._id);
            this.rebuildCollectionPreviews();

            if (this.isOwner) {
              this.sharing.updateSaved(false);
            }
          } else {
            this.profile = null;
            this.content = [];
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.profile = null;
          this.content = [];
          this.cdr.markForCheck();
        },
      });
  }

  get posts(): ContentItem[] {
    return this.content.filter((item) => item.type === 'post');
  }

  get reels(): ContentItem[] {
    return this.content.filter((item) => item.type === 'reel');
  }

  get displayedContent(): ContentItem[] {
    return this.activeTab === 'reels' ? this.reels : this.posts;
  }

  get followLabel(): string {
    return this.profile?.isFollowing ? 'Following' : 'Follow';
  }

  toggleFollow(): void {
    if (!this.profile || this.isOwner || this.followLoading) return;

    const previousProfile = this.profile;
    const wasFollowing = previousProfile.isFollowing;
    const previousCount = previousProfile.followersCount;

    // Optimistic update for responsive feedback.
    this.profile = {
      ...previousProfile,
      isFollowing: !wasFollowing,
      followersCount: Math.max(
        0,
        previousCount + (wasFollowing ? -1 : 1),
      ),
    };
    this.followLoading = true;
    this.cdr.markForCheck();

    this.userService
      .follow(previousProfile._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            const isFollowing = response.data.isFollowing;

            this.profile = {
              ...this.profile,
              isFollowing,
              followersCount: Math.max(
                0,
                previousCount + (isFollowing ? 1 : -1),
              ),
            };

            this.sharing.applyFollowingState(this.profile, isFollowing);

            if (
              isFollowing &&
              this.sharing.currentUser?._id &&
              this.profile._id !== this.sharing.currentUser._id
            ) {
              this.socket.emit('notification', {
                eventName: 'follow',
                type: 'user',
                data: this.sharing.currentUser._id,
                to: this.profile._id,
                redirect: this.profile._id,
              });
            }
          } else {
            this.profile = {
              ...previousProfile,
              isFollowing: wasFollowing,
              followersCount: previousCount,
            };
          }

          this.followLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.profile = {
            ...previousProfile,
            isFollowing: wasFollowing,
            followersCount: previousCount,
          };
          this.followLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  openChat(): void {
    if (!this.profile || this.isOwner) return;

    void this.router.navigate(['/messages'], {
      queryParams: { to: this.profile._id },
    });
  }

  openEdit(): void {
    void this.router.navigate(['/settings']);
  }

  closeEdit(refresh = false): void {
    this.editing = false;

    if (refresh) {
      this.sharing.refreshCurrentUser();
      void this.router.navigate(['/userProfile', this.profileId]);
    }

    this.cdr.markForCheck();
  }

  selectTab(tab: 'posts' | 'reels' | 'saved'): void {
    if (tab === 'saved' && !this.isOwner) return;

    this.activeTab = tab;

    if (tab === 'saved') {
      this.sharing.updateSaved(false);
    }

    this.cdr.markForCheck();
  }

  openCreate(): void {
    void this.router.navigate(['/create']);
  }

  createCollection(): void {
    const name = this.collectionName.trim();
    if (!name || this.collectionLoading || !this.isOwner) return;

    this.collectionLoading = true;
    this.cdr.markForCheck();

    this.userService
      .newCollection(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const created = response?.data?.collection;
          if (
            response?.success &&
            created?._id &&
            typeof created.collectionName === 'string' &&
            Array.isArray(created.saved)
          ) {
            this.collections = [...this.collections, created];
            this.collectionName = '';
            this.showCollectionForm = false;
            this.collectionActionError = '';
            this.sharing.refreshCurrentUser();
            this.rebuildCollectionPreviews();
          } else {
            this.collectionActionError = response?.message || 'The create-collection API returned an unexpected response.';
          }

          this.collectionLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not create the collection. Please try again.';
          this.collectionLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  deleteCollection(collection: Collection): void {
    if (!this.isOwner || this.deletingCollectionId) return;

    this.deletingCollectionId = collection._id;
    this.cdr.markForCheck();

    this.userService
      .deleteCollection(collection._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.success && Array.isArray(response.data?.collections)) {
            this.collections = response.data.collections;
            this.collectionActionError = '';
            this.sharing.refreshCurrentUser();
            this.rebuildCollectionPreviews();
          } else {
            this.collectionActionError = response?.message || 'The delete-collection API returned an unexpected response.';
          }

          this.deletingCollectionId = null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not delete the collection. Please try again.';
          this.deletingCollectionId = null;
          this.cdr.markForCheck();
        },
      });
  }

  /** Only globally-saved Posts can be added to a collection. */
  get addableSavedItems(): ContentItem[] {
    if (!this.selectedCollection) return [];

    const existingIds = new Set(
      ((this.selectedCollection.saved ?? []) as unknown[])
        .map((entry) => this.getReferenceId(entry))
        .filter((id): id is string => Boolean(id)),
    );

    return this.saved.items.filter((item) => {
      const id = this.getReferenceId(item);
      return Boolean(id) && item.type !== 'reel' && !existingIds.has(id!);
    });
  }

  openAddSavedItems(): void {
    if (!this.isOwner || !this.selectedCollection || this.savingCollectionItems || this.loadingAddSavedItems) return;

    this.selectedSavedIds = [];
    this.collectionActionError = '';
    this.showAddSavedItems = true;
    this.loadingAddSavedItems = true;
    this.cdr.markForCheck();

    // Fetch a fresh first page so the picker is based on the actual API response.
    this.userService
      .getSaved(1, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response?.success || !response.data || !Array.isArray(response.data.items)) {
            this.collectionActionError = response?.message || 'The saved-post API returned an unexpected response.';
          } else {
            const items = this.normalizeContentItems(response.data.items);
            this.saved = {
              ...response.data,
              items,
            };
            this.rebuildCollectionPreviews();
          }

          this.loadingAddSavedItems = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not load saved posts. Please try again.';
          this.loadingAddSavedItems = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadMoreSavedItemsForCollection(): void {
    if (this.loadingMoreSavedItems || this.loadingAddSavedItems || !this.saved.hasMore) return;

    this.loadingMoreSavedItems = true;
    this.collectionActionError = '';
    const nextPage = this.saved.page + 1;
    this.cdr.markForCheck();

    this.userService
      .getSaved(nextPage, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response?.success || !response.data || !Array.isArray(response.data.items)) {
            this.collectionActionError = response?.message || 'The saved-post API returned an unexpected response.';
            this.loadingMoreSavedItems = false;
            this.cdr.markForCheck();
            return;
          }

          const incoming = this.normalizeContentItems(response.data.items);
          const merged = new Map<string, ContentItem>();
          for (const item of [...this.saved.items, ...incoming]) {
            const id = this.getReferenceId(item);
            if (id && !merged.has(id)) merged.set(id, item);
          }

          this.saved = {
            ...response.data,
            items: Array.from(merged.values()),
          };
          this.loadingMoreSavedItems = false;
          this.rebuildCollectionPreviews();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not load more saved posts.';
          this.loadingMoreSavedItems = false;
          this.cdr.markForCheck();
        },
      });
  }

  closeAddSavedItems(): void {
    if (this.savingCollectionItems) return;
    this.showAddSavedItems = false;
    this.selectedSavedIds = [];
    this.collectionActionError = '';
    this.cdr.markForCheck();
  }

  isSelectedForCollection(item: ContentItem): boolean {
    return this.selectedSavedIds.includes(String(item._id));
  }

  toggleSavedItemSelection(item: ContentItem): void {
    const id = String(item._id ?? '');
    if (!id || this.savingCollectionItems) return;

    this.selectedSavedIds = this.selectedSavedIds.includes(id)
      ? this.selectedSavedIds.filter((selectedId) => selectedId !== id)
      : [...this.selectedSavedIds, id];

    this.cdr.markForCheck();
  }

  addSelectedToCollection(): void {
    const collection = this.selectedCollection;
    const selected = [...new Set(this.selectedSavedIds)];

    if (!this.isOwner || !collection || !selected.length || this.savingCollectionItems) return;

    const selectedItems = this.saved.items.filter((item) => selected.includes(String(item._id)));
    this.savingCollectionItems = true;
    this.collectionActionError = '';
    this.cdr.markForCheck();

    this.userService
      .addToCollection({ selected, collectionId: collection._id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const returnedCollection = response?.data?.collection;
          if (
            !response?.success ||
            !returnedCollection?._id ||
            !Array.isArray(returnedCollection.saved)
          ) {
            this.collectionActionError = response?.message || 'The add-to-collection API returned an unexpected response.';
            this.savingCollectionItems = false;
            this.cdr.markForCheck();
            return;
          }

          this.selectedCollection = returnedCollection;
          this.collections = this.collections.map((item) =>
            item._id === returnedCollection._id ? returnedCollection : item,
          );

          const mergedItems = new Map<string, ContentItem>();
          for (const item of [...this.loadedCollectionItems, ...selectedItems]) {
            const id = this.getReferenceId(item);
            if (id && !mergedItems.has(id)) mergedItems.set(id, item);
          }
          this.loadedCollectionItems = Array.from(mergedItems.values());
          this.previewMap.set(returnedCollection._id, this.loadedCollectionItems.slice(0, 4));

          this.showAddSavedItems = false;
          this.selectedSavedIds = [];
          this.savingCollectionItems = false;
          this.sharing.refreshCurrentUser();
          this.cdr.markForCheck();

          // Re-fetch details to verify the saved IDs and display-ready item data returned by the server.
          this.fetchCollectionItems(returnedCollection, false);
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not add these posts. Please try again.';
          this.savingCollectionItems = false;
          this.cdr.markForCheck();
        },
      });
  }

  removeCollectionItem(item: ContentItem): void {
    const collection = this.selectedCollection;
    const itemId = String(item?._id ?? '');

    if (!this.isOwner || !collection || !itemId || this.removingCollectionItemId) return;

    this.removingCollectionItemId = itemId;
    this.collectionActionError = '';
    this.cdr.markForCheck();

    this.userService
      .removeFromCollection(collection._id, itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const returnedCollection = response?.data?.collection;
          if (
            !response?.success ||
            !returnedCollection?._id ||
            !Array.isArray(returnedCollection.saved)
          ) {
            this.collectionActionError = response?.message || 'The remove-from-collection API returned an unexpected response.';
            this.removingCollectionItemId = null;
            this.cdr.markForCheck();
            return;
          }

          this.selectedCollection = returnedCollection;
          this.collections = this.collections.map((entry) =>
            entry._id === returnedCollection._id ? returnedCollection : entry,
          );
          this.loadedCollectionItems = this.loadedCollectionItems.filter(
            (entry) => this.getReferenceId(entry) !== itemId,
          );
          this.previewMap.set(returnedCollection._id, this.loadedCollectionItems.slice(0, 4));
          this.removingCollectionItemId = null;
          this.sharing.refreshCurrentUser();
          this.cdr.markForCheck();

          // Confirm the returned server state rather than assuming the local mutation succeeded.
          this.fetchCollectionItems(returnedCollection, false);
        },
        error: (error) => {
          this.collectionActionError = error?.error?.message || 'Could not remove this item. Please try again.';
          this.removingCollectionItemId = null;
          this.cdr.markForCheck();
        },
      });
  }

  private rebuildCollectionPreviews(): void {
    this.previewMap.clear();

    for (const collection of this.collections) {
      this.previewMap.set(
        collection._id,
        this.resolveCollectionItems(collection).slice(0, 4),
      );
    }
  }

  /** Resolve collection refs against loaded Saved/Profile items as a local fallback. */
  private resolveCollectionItems(collection: Collection): ContentItem[] {
    const entries = (collection.saved ?? []) as unknown[];
    const resolved: ContentItem[] = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      const id = this.getReferenceId(entry);
      let item: ContentItem | undefined;

      if (id) {
        item = this.saved.items.find((savedItem) => this.getReferenceId(savedItem) === id);
        if (!item) {
          item = this.content.find((contentItem) => this.getReferenceId(contentItem) === id);
        }
      }

      if (!item && entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const hasPostMedia = Array.isArray(record['postsImgAndVideos']);
        const hasDirectMedia = typeof record['url'] === 'string';

        if (record['_id'] && (hasPostMedia || hasDirectMedia)) {
          const detectedType = record['type'] === 'reel' || (!hasPostMedia && hasDirectMedia)
            ? 'reel'
            : 'post';
          item = {
            ...(record as unknown as ContentItem),
            type: (record['type'] as ContentItem['type']) || detectedType,
          };
        }
      }

      if (!item) continue;
      const itemId = this.getReferenceId(item) || `${resolved.length}`;
      if (seen.has(itemId)) continue;
      seen.add(itemId);
      resolved.push(item);
    }

    return resolved;
  }

  private normalizeContentItems(value: unknown): ContentItem[] {
    if (!Array.isArray(value)) return [];

    const normalized: ContentItem[] = [];
    const seen = new Set<string>();

    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const id = this.getReferenceId(record);
      const hasPostMedia = Array.isArray(record['postsImgAndVideos']);
      const hasDirectMedia = typeof record['url'] === 'string' && Boolean(record['url']);

      if (!id || (!hasPostMedia && !hasDirectMedia) || seen.has(id)) continue;

      const inferredType: ContentItem['type'] =
        record['type'] === 'reel' || (!hasPostMedia && hasDirectMedia)
          ? 'reel'
          : 'post';

      normalized.push({
        ...(record as unknown as ContentItem),
        _id: id,
        type: inferredType,
      });
      seen.add(id);
    }

    return normalized;
  }

  private fetchCollectionItems(collection: Collection, showLoading: boolean): void {
    if (showLoading) {
      this.collectionItemsLoading = true;
      this.collectionItemsError = '';
      this.unavailableCollectionItemsCount = 0;
      this.cdr.markForCheck();
    }

    this.userService
      .getCollectionItems(collection._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.selectedCollection?._id !== collection._id) return;

          const data = response?.data;
          if (
            !response?.success ||
            !data?.collection?._id ||
            String(data.collection._id) !== String(collection._id) ||
            !Array.isArray(data.collection.saved) ||
            !Array.isArray(data.items) ||
            !Array.isArray(data.unavailableItemIds)
          ) {
            if (showLoading) this.collectionItemsLoading = false;
            this.collectionItemsError = response?.message || 'The collection API returned an unexpected data shape.';
            this.cdr.markForCheck();
            return;
          }

          const resolvedItems = this.normalizeContentItems(data.items);
          this.selectedCollection = data.collection;
          this.collections = this.collections.map((item) =>
            item._id === data.collection._id ? data.collection : item,
          );
          this.loadedCollectionItems = resolvedItems;
          this.unavailableCollectionItemsCount =
            data.unavailableItemIds.length + Math.max(0, data.items.length - resolvedItems.length);
          this.collectionItemsError = '';
          if (showLoading) this.collectionItemsLoading = false;

          this.rebuildCollectionPreviews();
          this.previewMap.set(data.collection._id, resolvedItems.slice(0, 4));
          this.cdr.markForCheck();
        },
        error: (error) => {
          if (this.selectedCollection?._id !== collection._id) return;
          if (showLoading) this.collectionItemsLoading = false;
          this.collectionItemsError = error?.error?.message || 'Could not load this collection. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  reloadSelectedCollectionItems(): void {
    if (!this.selectedCollection || this.collectionItemsLoading) return;
    this.fetchCollectionItems(this.selectedCollection, true);
  }

  collectionPreview(collection: Collection): ContentItem[] {
    return this.previewMap.get(collection._id) ?? this.resolveCollectionItems(collection).slice(0, 4);
  }

  get selectedCollectionItems(): ContentItem[] {
    return this.selectedCollection ? this.loadedCollectionItems : [];
  }

  openCollection(collection: Collection): void {
    this.selectedContent = undefined;
    this.selectedCollection = collection;
    this.loadedCollectionItems = this.resolveCollectionItems(collection);
    this.collectionActionError = '';
    this.collectionItemsError = '';
    this.collectionItemsLoading = true;
    this.unavailableCollectionItemsCount = 0;
    this.cdr.markForCheck();
    this.fetchCollectionItems(collection, true);
  }

  closeCollection(): void {
    if (this.savingCollectionItems || this.removingCollectionItemId) return;
    this.selectedCollection = null;
    this.loadedCollectionItems = [];
    this.collectionItemsLoading = false;
    this.collectionItemsError = '';
    this.collectionActionError = '';
    this.showAddSavedItems = false;
    this.cdr.markForCheck();
  }

  openCollectionContent(item: ContentItem): void {
    this.selectedCollection = null;
    this.loadedCollectionItems = [];
    this.selectedContent = item;
    this.cdr.markForCheck();
  }

  private getReferenceId(value: unknown): string | null {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const id = record['_id'] ?? record['id'];
    return id == null ? null : String(id);
  }

  openContent(item: ContentItem): void {
    this.selectedCollection = null;
    this.selectedContent = item;
    this.cdr.markForCheck();
  }

  closeContent(): void {
    this.selectedContent = undefined;
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showAddSavedItems) {
      this.closeAddSavedItems();
    } else if (this.selectedContent) {
      this.closeContent();
    } else if (this.selectedCollection) {
      this.closeCollection();
    }
  }

  handleImageError(event: Event, fallback: string): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.getAttribute('src') === fallback) return;

    image.src = fallback;
  }

  mediaUrl(item: ContentItem): string {
    return (
      item.postsImgAndVideos?.[0]?.url ||
      item.url ||
      './assets/imgs/placeholder.png'
    );
  }

  isVideo(item: ContentItem): boolean {
    const mediaType:any = item.postsImgAndVideos?.[0]?.type;

    return (
      item.type === 'reel' ||
      mediaType === 'video' ||
      mediaType === 'videos'
    );
  }

  trackById(_: number, item: { _id: string }): string {
    return item._id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
