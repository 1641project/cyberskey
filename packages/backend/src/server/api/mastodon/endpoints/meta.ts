import { Entity } from "@cutls/megalodon"
export function getInstance (response: Entity.Instance) {
    return  {
    "uri": response.uri,
    "title": response.title || '',
    "short_description":  response.description || '',
    "description": response.description || '',
    "email": response.email || '',
    "version": '3.0.0 compatible(Misskey)',
    "urls": response.urls,
    "stats": response.stats,
    "thumbnail": response.thumbnail || '',
    "languages": [
        "en",
        "ja"
    ],
    "registrations": response.registrations,
    "approval_required": false,
    "invites_enabled": false,
    "configuration": {
        "accounts": {
            "max_featured_tags": 10
        },
        "statuses": {
            "max_characters": 3000,
            "max_media_attachments": 4,
            "characters_reserved_per_url": response.uri.length
        },
        "media_attachments": {
            "supported_mime_types": [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/heic",
                "image/heif",
                "image/webp",
                "image/avif",
                "video/webm",
                "video/mp4",
                "video/quicktime",
                "video/ogg",
                "audio/wave",
                "audio/wav",
                "audio/x-wav",
                "audio/x-pn-wave",
                "audio/vnd.wave",
                "audio/ogg",
                "audio/vorbis",
                "audio/mpeg",
                "audio/mp3",
                "audio/webm",
                "audio/flac",
                "audio/aac",
                "audio/m4a",
                "audio/x-m4a",
                "audio/mp4",
                "audio/3gpp",
                "video/x-ms-asf"
            ],
            "image_size_limit": 10485760,
            "image_matrix_limit": 16777216,
            "video_size_limit": 41943040,
            "video_frame_rate_limit": 60,
            "video_matrix_limit": 2304000
        },
        "polls": {
            "max_options": 4,
            "max_characters_per_option": 50,
            "min_expiration": 300,
            "max_expiration": 2629746
        }
    },
    "contact_account": {
        id: "1",
        username: 'admin',
        acct: 'admin',
        display_name: 'admin',
        locked: true,
        bot: true,
        discoverable: false,
        group: false,
        created_at: '1971-01-01T00:00:00.000Z',
        note: '',
        url: 'https://example.com',
        avatar: '/missing',
        avatar_static: '/missing',
        header: '/missing',
        header_static: '/missing',
        followers_count: -1,
        following_count: 0,
        statuses_count: 0,
        last_status_at: '1971-01-01T00:00:00.000Z',
        noindex: true,
        emojis: [],
        fields: []
    },
    "rules": [
        {
            "id": "2",
            "text": "糖分を摂りすぎない"
        },
        {
            "id": "3",
            "text": "塩分も控えめにする"
        },
        {
            "id": "4",
            "text": "運動習慣"
        }
    ]
}
}