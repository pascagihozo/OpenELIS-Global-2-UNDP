import React, { useState, useEffect } from "react";
import {
  Grid,
  Column,
  TextInput,
  Button,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
  Tile,
  Loading,
  Form,
  InlineNotification
} from "@carbon/react";
import { FormattedMessage, useIntl } from "react-intl";
import axios from 'axios'; // Using axios for HTTP requests
import { useNavigate } from "react-router-dom";

// Updated TypeScript interfaces to match Odoo invoice structure
interface Invoice {
  id: number;
  name: string; // Invoice number
  partner_id: [number, string]; // [ID, Name] for client/partner
  amount_total: number;
  state: string; // e.g., 'draft', 'posted', 'paid'
  invoice_date: string;
}

interface NewInvoice {
  partner_id: number; // Client/Partner ID
  amount_total: number;
  state: string;
  invoice_date: string;
}

const BillingPage: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  // State Management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Partners/Clients list for dropdown (you'd typically fetch this from Odoo)
  const [partners, setPartners] = useState<{id: number, name: string}[]>([]);
  
  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    partner_id: 0,
    amount_total: 0,
    state: "draft",
    invoice_date: new Date().toISOString().split('T')[0]
  });

  // Odoo JSON-RPC configuration
  const odooConfig = {
    baseURL: 'https://united-nations-development-programme.odoo.com/jsonrpc',
    database: 'united-nations-development-programme',
    username: 'your_username',
    password: 'your_password'
  };

  // Fetch invoices from Odoo
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(odooConfig.baseURL, {
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              odooConfig.database,
              2, // User ID
              odooConfig.password,
              "account.move",
              "search_read",
              [[]],
              {
                fields: ["name", "partner_id", "amount_total", "state", "invoice_date"],
                limit: 100
              }
            ]
          },
          id: 1
        });

        if (response.data.result) {
          setInvoices(response.data.result);
          setFilteredInvoices(response.data.result);
        }
      } catch (err) {
        setError("Failed to fetch invoices");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPartners = async () => {
      try {
        const response = await axios.post(odooConfig.baseURL, {
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              odooConfig.database,
              2, // User ID
              odooConfig.password,
              "res.partner",
              "search_read",
              [[]],
              {
                fields: ["id", "name"],
                limit: 100
              }
            ]
          },
          id: 2
        });

        if (response.data.result) {
          setPartners(response.data.result);
        }
      } catch (err) {
        console.error("Failed to fetch partners", err);
      }
    };

    fetchInvoices();
    fetchPartners();
  }, []);

  // Rest of the component remains similar, with modifications to match Odoo's data structure

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(odooConfig.baseURL, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            odooConfig.database,
            2, // User ID
            odooConfig.password,
            "account.move",
            "create",
            [{
              partner_id: newInvoice.partner_id,
              amount_total: newInvoice.amount_total,
              state: newInvoice.state,
              invoice_date: newInvoice.invoice_date
            }]
          ]
        },
        id: 3
      });

      if (response.data.result) {
        // Refresh invoices list or add the new invoice to the state
        setIsSubmitting(false);
        // Reset form
        setNewInvoice({
          partner_id: 0,
          amount_total: 0,
          state: "draft",
          invoice_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      setError("Failed to create invoice");
      setIsSubmitting(false);
    }
  };

  // Render method would need to be updated to match new data structure
  return (
    <Grid fullWidth style={{ padding: "2rem", minHeight: "100vh" }}>
      {/* Similar structure to previous component, but with updated field names */}
      <Column lg={16} md={8} sm={4}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Invoice Number</TableHeader>
              <TableHeader>Client</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Date</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {getCurrentPageItems().map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.name}</TableCell>
                <TableCell>{invoice.partner_id[1]}</TableCell>
                <TableCell>{invoice.amount_total}</TableCell>
                <TableCell>{invoice.state}</TableCell>
                <TableCell>{invoice.invoice_date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* New Invoice Form with partner dropdown */}
        <Form onSubmit={handleSubmit}>
          <select 
            value={newInvoice.partner_id} 
            onChange={(e) => setNewInvoice({...newInvoice, partner_id: Number(e.target.value)})}
          >
            <option value={0}>Select Client</option>
            {partners.map(partner => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
          {/* Other form fields similarly updated */}
        </Form>
      </Column>
    </Grid>
  );
};

export default BillingPage;