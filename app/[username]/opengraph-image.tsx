import { ImageResponse } from 'next/og';
import { resolveUserByUsername } from '@/lib/userLookup';

export const alt = 'LinkID Profile';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const resolved = await resolveUserByUsername(username);

  if (!resolved) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 64,
            background: '#09090b',
            color: '#ffffff',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          User Not Found
        </div>
      ),
      { ...size }
    );
  }

  const user = resolved.user;
  const displayName = user.name || user.username || username;
  const links = user.links || [];

  // Resolve avatar URL
  let avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=256`;
  if (avatarUrl.startsWith('/')) {
    avatarUrl = `https://linkid.qzz.io${avatarUrl}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(49, 46, 129, 0.4), #000000 60%), radial-gradient(circle at 85% 30%, rgba(79, 70, 229, 0.3), #000000 60%)',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          padding: 60,
        }}
      >
        {/* Main Bento Container */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            gap: 40,
          }}
        >
          {/* Left Column: Profile Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(24, 24, 27, 0.6)',
              borderRadius: 32,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 40,
              flex: '1',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={avatarUrl}
              alt={displayName}
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                marginBottom: 30,
                objectFit: 'cover',
                border: '4px solid #6366f1', // Indigo border for premium look
              }}
            />
            <h1
              style={{
                fontSize: 56,
                fontWeight: 'bold',
                margin: 0,
                marginBottom: user.bio ? 16 : 0,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </h1>
            {user.bio && (
              <p
                style={{
                  fontSize: 28,
                  color: '#a1a1aa',
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {user.bio}
              </p>
            )}
            
            <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', opacity: 0.7 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>LinkID</span>
            </div>
          </div>

          {/* Right Column: Links/Bento Grid */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1.2',
              gap: 24,
              justifyContent: 'center',
            }}
          >
            {[0, 1, 2].map((index) => {
              const link = links[index];
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: link ? 'rgba(39, 39, 42, 0.8)' : 'rgba(39, 39, 42, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 24,
                    padding: '30px 40px',
                    width: '100%',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: link ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 24,
                    }}
                  >
                    {link && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div
                      style={{
                        height: link ? 'auto' : 24,
                        width: link ? 'auto' : '60%',
                        background: link ? 'transparent' : 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: '#f4f4f5',
                      }}
                    >
                      {link ? link.label : ''}
                    </div>
                    {link && link.url && (
                      <div style={{ fontSize: 20, color: '#a1a1aa', marginTop: 8 }}>
                        {link.url.replace(/^https?:\/\//, '').split('/')[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
