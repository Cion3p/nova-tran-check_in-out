import type { Metadata } from 'next';
import CheckInClientPage from './CheckInClientPage'; // Import the new client component

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  return {
    title: `Check-in for ${username}`,
    description: `Check-in/out application for ${username}`,
    manifest: `/manifest?username=${encodeURIComponent(username)}`,
  };
}

export default function CheckInPage({ params }: { params: { username: string } }) {
  const decodedUsername = decodeURIComponent(params.username);
  return <CheckInClientPage username={decodedUsername} />;
}
