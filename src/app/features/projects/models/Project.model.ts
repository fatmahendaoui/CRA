import { TimesheetItem } from './TimesheetItem.model';
// Interface for Origine
export interface Group {
  id: string;      // Unique identifier for the group
  name: string;    // Name of the group
  iddomain: string; // Domain ID to which the group belongs
}

// Interface for Group
export interface Brand {
  id: string;      // Unique identifier for the brand
  name: string;    // Name of the brand
  groupId: string; // The group ID to which the brand belongs
}

// Interface for Client
export interface Product {
  id: string;      // Unique identifier for the product
  name: string;    // Name of the product
  brandId: string; // The brand ID to which the product belongs
}
// Interface for Marque
export interface Marque {
  id: string;      // Unique identifier for the product
  name: string;    // Name of the product
  productId: string; // The brand ID to which the product belongs
}
// Interface for Media
export interface Media {
  id: string;      // Unique identifier for the product
  name: string;    // Name of the product
  marqueId: string; // The brand ID to which the product belongs
}
// Interface for Project
export interface Project {
  name: string;
  id: string;
  projectTotal: number;
  managerId: string;
  users: string[];
  groupId: string,
  brandId: string,
  productId: string,
  marqueId:string,
  mediaId:string
}
