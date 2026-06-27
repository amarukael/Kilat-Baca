'use client';

import { fr } from '@/lib/styles';

interface Props {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }: Props) {
  if (categories.length === 0) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ ...fr(500, '12px'), color: 'var(--text-light)', marginBottom: '8px' }}>Filter Kategori</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onSelectCategory('')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: selectedCategory === '' ? 'var(--primary)' : 'var(--bg-light)',
            color: selectedCategory === '' ? 'white' : 'var(--text-dark)',
            cursor: 'pointer',
            ...fr(500, '12px'),
            transition: 'all 0.2s',
          }}
        >
          Semua
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: selectedCategory === category ? 'var(--primary)' : 'var(--bg-light)',
              color: selectedCategory === category ? 'white' : 'var(--text-dark)',
              cursor: 'pointer',
              ...fr(500, '12px'),
              transition: 'all 0.2s',
            }}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
