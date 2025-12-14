/**
 * Contact Type Definition
 *
 * Represents a person in the user's contact list.
 * Contacts can be linked to occasions (birthdays, anniversaries, etc.)
 * to automatically generate recurring calendar events.
 *
 * Learning note: Interfaces in TypeScript define the shape of objects.
 * Using interfaces instead of classes keeps the data lightweight
 * and allows for easy serialization to/from IndexedDB.
 */

/**
 * Core contact information for a person
 *
 * @property id - Unique identifier (UUID format)
 * @property firstName - Required first name
 * @property lastName - Required last name
 * @property email - Optional email address for notifications
 * @property phone - Optional phone number
 * @property notes - Optional notes about the contact
 * @property createdAt - ISO timestamp when contact was created
 * @property updatedAt - ISO timestamp when contact was last modified
 */
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper type for creating a new contact
 * Omits auto-generated fields (id, createdAt, updatedAt)
 *
 * Learning note: Using Omit<> utility type creates a new type
 * without specific properties, useful for form inputs
 */
export type NewContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Helper type for updating an existing contact
 * Makes all fields optional except id
 *
 * Learning note: Partial<> makes all properties optional,
 * combined with Pick<> to require specific fields
 */
export type ContactUpdate = Partial<Omit<Contact, 'id'>> & Pick<Contact, 'id'>;
