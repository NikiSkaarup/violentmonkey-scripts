/* eslint-disable @typescript-eslint/no-unused-vars */
/*
    Floatplane API
    Currently typed
    - https://www.floatplane.com/api/v3/content/creator/list as listResponse
*/
namespace floatplane {
  type metaData = {
    hasVideo: boolean;
    videoCount: number;
    videoDuration: number;
    hasAudio: boolean;
    audioCount: number;
    audioDuration: number;
    hasPicture: boolean;
    pictureCount: number;
    hasGallery: boolean;
    galleryCount: number;
    isFeatured: boolean;
  };

  type owner = {
    id: string;
    username: string;
  }

  type category = {
    title: string;
  }

  type imageType = {
    width: number;
    height: number;
    path: string;
    childImages: { width: number; height: number; path: string; }[];
  }

  type liveStream = {
    id: string;
    title: string;
    description: string;
    thumbnail: imageType;
    owner: string;
    streamPath: string;
    offline?: {
      title: string;
      description: string;
      thumbnail: imageType;
    }
  };

  type subscriptionPlan = {
    id: string;
    title: string;
    description: string;
    price: string;
    priceYearly: string;
    currency: string;
    logo: string | null;
    interval: string;
    featured: boolean;
    allowGrandfatheredAccess: boolean;
    discordServers: string[];
    discordRoles: string[];
  };

  type creator = {
    id: string;
    owner: owner;
    title: string;
    urlname: string;
    description: string;
    about: string;
    category: category;
    cover: imageType;
    icon: imageType;
    liveStream: liveStream;
    subscriptionPlans: subscriptionPlan[];
    discoverable: boolean;
    subscriberCountDisplay: string;
    incomeDisplay: boolean;
    card: imageType;
  };

  type blogPost = {
    id: string;
    guid: string;
    title: string;
    text: string;
    type: 'blogPost';
    tags: string[];
    attachmentOrder: string[];
    metadata: metaData;
    releaseDate: string;
    likes: number;
    dislikes: number;
    score: number;
    comments: number;
    creator: creator;
    wasReleasedSilently: boolean;
    thumbnail: imageType;
    isAccessible: boolean;
    VideoAttachments: string[];
    audioAttachments: string[];
    pictureAttachments: string[];
    galleryAttachments: string[];
  }

  type listResponse = {
    blogPosts: blogPost[];
  }
}
