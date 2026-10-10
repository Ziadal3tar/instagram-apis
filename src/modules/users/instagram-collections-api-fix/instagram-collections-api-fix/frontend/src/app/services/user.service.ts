import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Collection,
  ContentItem,
  CurrentUser,
  ProfileResponse,
  SavedPage,
  UserSummary,
} from '../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getUserData(): Observable<ApiResponse<{ userData: CurrentUser }>> {
    return this.http.post<ApiResponse<{ userData: CurrentUser }>>(`${this.baseUrl}/getUserData`, {});
  }

  getProfilesData(id: string): Observable<ApiResponse<ProfileResponse>> {
    return this.http.post<ApiResponse<ProfileResponse>>(`${this.baseUrl}/getProfilesData`, { _id: id });
  }

  changeUserImage(data: FormData): Observable<ApiResponse<{ user: UserSummary }>> {
    return this.http.post<ApiResponse<{ user: UserSummary }>>(`${this.baseUrl}/changeUserImage`, data);
  }

  searchUser(text: string): Observable<ApiResponse<{ users: UserSummary[] }>> {
    return this.http.post<ApiResponse<{ users: UserSummary[] }>>(`${this.baseUrl}/searchUser`, { text });
  }

  visited(id: string): Observable<ApiResponse<{ visited: boolean }>> {
    return this.http.get<ApiResponse<{ visited: boolean }>>(`${this.baseUrl}/visited/${id}`);
  }

  follow(id: string): Observable<ApiResponse<{ action: 'follow' | 'unfollow'; isFollowing: boolean }>> {
    return this.http.get<ApiResponse<{ action: 'follow' | 'unfollow'; isFollowing: boolean }>>(`${this.baseUrl}/follow/${id}`);
  }

  newCollection(collectionName: string): Observable<ApiResponse<{ collection: Collection }>> {
    return this.http.post<ApiResponse<{ collection: Collection }>>(`${this.baseUrl}/newCollection`, { collectionName });
  }

  savePost(postId: string, ref: 'Post' | 'Reel'): Observable<ApiResponse<{ saved: boolean; type: string; postId: string }>> {
    return this.http.post<ApiResponse<{ saved: boolean; type: string; postId: string }>>(`${this.baseUrl}/savePost`, { postId, ref });
  }

  addToCollection(data: { selected: string[]; collectionId: string }): Observable<ApiResponse<{ collection: Collection }>> {
    return this.http.post<ApiResponse<{ collection: Collection }>>(
      `${this.baseUrl}/addToCollection`,
      data,
    );
  }

  getCollectionItems(collectionId: string): Observable<ApiResponse<{
    collection: Collection;
    items: ContentItem[];
    unavailableItemIds: string[];
  }>> {
    return this.http.get<ApiResponse<{
      collection: Collection;
      items: ContentItem[];
      unavailableItemIds: string[];
    }>>(`${this.baseUrl}/collections/${collectionId}/items`);
  }

  getFeed(page = 1, limit = 10): Observable<ApiResponse<{ page: number; limit: number; items: ContentItem[]; hasMore: boolean }>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<{ page: number; limit: number; items: ContentItem[]; hasMore: boolean }>>(`${environment.apiUrl}/feed`, { params });
  }

  getSaved(page = 1, limit = 30): Observable<ApiResponse<SavedPage>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<SavedPage>>(`${this.baseUrl}/getSaved`, { params });
  }

  allNotificationSeen(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseUrl}/allNotificationSeen`);
  }

  bio(bio: string): Observable<ApiResponse<{ user: UserSummary }>> {
    return this.http.post<ApiResponse<{ user: UserSummary }>>(`${this.baseUrl}/bio`, { bio });
  }

  deleteCollection(id: string): Observable<ApiResponse<{ collections: Collection[] }>> {
    return this.http.delete<ApiResponse<{ collections: Collection[] }>>(`${this.baseUrl}/deleteCollection/${id}`);
  }

  removeFromCollection(
    collectionId: string,
    itemId: string,
  ): Observable<ApiResponse<{ collection: Collection; removedItemId: string }>> {
    return this.http.delete<ApiResponse<{ collection: Collection; removedItemId: string }>>(
      `${this.baseUrl}/collections/${collectionId}/items/${itemId}`,
    );
  }

}
