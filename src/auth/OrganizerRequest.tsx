import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export const OrganizerRequest: React.FC = () => {
  const [orgName, setOrgName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [about, setAbout] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!orgName) newErrors.orgName = 'Organization name is required';
    if (!businessEmail) newErrors.businessEmail = 'Business email is required';
    if (!phone) newErrors.phone = 'Phone number is required';
    if (!eventType) newErrors.eventType = 'Event type is required';
    if (!about) newErrors.about = 'Please describe your events';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert(`Organizer Request submitted successfully for ${orgName}! 🚀`);
    }
  };

  return (
    <div className="bg-blue-pattern min-h-screen flex items-center justify-center p-6">
      <div className="bg-brand-white border-3 border-ink-black rounded-28 shadow-soft-3d w-full max-w-[640px] py-9 px-8 flex flex-col items-center text-center z-10">
        <Badge variant="yellow" uppercase={true}>
          Become an Organizer
        </Badge>

        <h2 className="font-heading font-bold text-[28px] text-ink-black mt-4 mb-2 leading-tight">
          Start selling tickets
        </h2>
        <p className="font-body text-[15px] text-ink-gray-70 mb-6 leading-relaxed text-center">
          Tell us a bit about your organization. Our team typically reviews requests within 1–2 business days.
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Organization Name"
            type="text"
            placeholder="e.g. Live Nation Presents"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            error={errors.orgName}
          />

          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <Input
              label="Business Email"
              type="email"
              placeholder="you@organization.com"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              error={errors.businessEmail}
              className="flex-1"
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              className="flex-1"
            />
          </div>

          <Input
            label="Event Type"
            type="text"
            placeholder="Concerts, Movies, Sports..."
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            error={errors.eventType}
          />

          <Input
            label="Tell us about your events"
            type="textarea"
            placeholder="We host indie music festivals across the west coast..."
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            error={errors.about}
          />

          <Button type="submit" variant="primary" className="mt-2">
            Submit Request
          </Button>
        </form>
      </div>
    </div>
  );
};
