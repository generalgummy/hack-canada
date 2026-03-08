import React, { useState } from 'react';

const ROLES = [
  {
    id: 'hunter',
    title: 'Hunter / Harvestor',
    subtitle: 'Sell harvested food to communities',
    gradient: 'linear-gradient(to right, #E05252 55%, #4A90D9 55%)',
    iconBg: '#FDEAEA',
    emoji: 'Hunter',
  },
  {
    id: 'community',
    title: 'Community / School',
    subtitle: 'Order food for your community',
    gradient: 'linear-gradient(to right, #2A5C2A 45%, #F5C200 45%)',
    iconBg: '#D4EDDA',
    emoji: 'Community',
  },
  {
    id: 'supplier',
    title: 'Mass Supplier',
    subtitle: 'Supply food in bulk quantities',
    gradient: 'linear-gradient(to right, #4A90D9 50%, #E8834A 50%)',
    iconBg: '#D6EAF8',
    emoji: 'Supplier',
  },
];

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AccountTypeScreen = () => {
  const [selected, setSelected] = useState(null);

  const resolveAsset = (src) => {
    if (typeof src === 'number') return undefined;
    if (src && src.uri) return src.uri;
    return src;
  };

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundColor: '#F5E6C8',
          backgroundImage: 'radial-gradient(circle, #D0C4A8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full" style={{ maxWidth: 390, padding: 24 }}>
          {/* Wheat Icon */}
          <div className="flex justify-center" style={{ marginBottom: 16 }}>
            <img src={resolveAsset(wheatImg)} alt="wheat" style={{ width: 56, height: 56, objectFit: 'contain' }} />
          </div>

          {/* Title */}
          <h1
            className="text-center"
            style={{
              fontFamily: "'Nunito_800ExtraBold', cursive",
              fontSize: 28,
              color: '#1A1A1A',
              margin: 0,
              marginBottom: 4,
            }}
          >
            Join Northern Harvest
          </h1>
          <p
            className="text-center"
            style={{ fontFamily: "Nunito_400Regular", fontSize: 14, color: '#7A7A7A', margin: 0, marginBottom: 32 }}
          >
            Choose your account type
          </p>

          {/* Role Cards */}
          <div className="flex flex-col" style={{ gap: 12, marginBottom: 32 }}>
            {ROLES.map((role) => {
              const isSelected = selected === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelected(role.id)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'left',
                    width: '100%',
                    backgroundColor: '#FAF0DC',
                    borderRadius: 16,
                    border: isSelected
                      ? '2px solid #2A5C2A'
                      : '2px solid #1A1A1A',
                    padding: 0,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      background: role.gradient,
                    }}
                  />

                  <div
                    className="flex items-center"
                    style={{ padding: 12, gap: 12 }}
                  >
                    {/* Icon area */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 70,
                        height: 70,
                        flexShrink: 0,
                        borderRadius: 12,
                        backgroundColor: role.iconBg,
                      }}
                    >
                      <img src={resolveAsset(role.img)} alt={role.title} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Nunito_800ExtraBold', cursive",
                          fontSize: 17,
                          fontWeight: 700,
                          color: '#1A1A1A',
                          lineHeight: 1.3,
                        }}
                      >
                        {role.title}
                      </div>
                      <div style={{ fontFamily: "Nunito_400Regular", fontSize: 13, color: '#7A7A7A', marginTop: 3 }}>
                        {role.subtitle}
                      </div>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          borderRadius: '50%',
                          backgroundColor: '#2A5C2A',
                        }}
                      >
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button */}
          <button
            type="button"
            style={{
              width: '100%',
              padding: '14px 0',
              backgroundColor: '#F5C200',
              borderRadius: 999,
              border: '2px solid #1A1A1A',
              fontFamily: "'Nunito_800ExtraBold', cursive",
              fontSize: 18,
              color: '#1A1A1A',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            Continue
          </button>

          {/* Sign In link */}
          <p
            className="text-center"
            style={{ fontFamily: "Nunito_400Regular", fontSize: 14, color: '#7A7A7A', marginTop: 16 }}
          >
            Already have an account?{' '}
            <a
              href="#"
              style={{
                color: '#1A1A1A',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Sign In
            </a>
          </p>
        </div>

        {/* FAB */}
        <button
          type="button"
          className="flex items-center justify-center"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: '#F5C200',
            border: '2px solid #1A1A1A',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#1A1A1A',
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
            outline: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          +
        </button>
      </div>
    </>
  );
};

export default AccountTypeScreen;
