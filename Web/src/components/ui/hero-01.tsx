import HeroSection, { type AvatarList } from '@/components/ui/hero-01-utils/hero';
import BrandSlider, { type BrandList } from '@/components/ui/hero-01-utils/brand-slider';

export default function AgencyHeroSection() {
  const avatarList: AvatarList[] = [
    { image: '/showcase/avatar-1.svg' },
    { image: '/showcase/avatar-2.svg' },
    { image: '/showcase/avatar-3.svg' },
    { image: '/showcase/avatar-4.svg' },
  ];

  const brandList: BrandList[] = [
    { image: '/showcase/brand-windows.svg', name: 'Windows' },
    { image: '/showcase/brand-android.svg', name: 'Android' },
    { image: '/showcase/brand-linux.svg', name: 'Linux' },
    { image: '/showcase/brand-macos.svg', name: 'macOS' },
  ];

  return (
    <div className="relative">
      <HeroSection avatarList={avatarList} />
      <BrandSlider brandList={brandList} />
    </div>
  );
}
