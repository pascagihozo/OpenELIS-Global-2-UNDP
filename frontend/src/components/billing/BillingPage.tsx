import React, { useState, useEffect } from "react";
import {
  Grid,
  Column,
  TextInput,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
  Loading,
  Form,
  InlineNotification,
  Select,
  SelectItem,
  NumberInput,
  DatePicker,
  DatePickerInput,
} from "@carbon/react";
import { Search } from "@carbon/icons-react";
import { FormattedMessage, useIntl } from "react-intl";
import { withRouter, RouteComponentProps } from "react-router-dom";

// TypeScript interfaces
interface Invoice {
  id: number;
  name: string;
  partner_id: [number, string];
  amount_total: number;
  state: string;
  invoice_date: string;
}

interface NewInvoice {
  partner_id: number;
  amount_total: number;
  state: string;
  invoice_date: string;
}

interface Partner {
  id: number;
  name: string;
}

const BillingPage: React.FC<RouteComponentProps> = ({ history }) => {
  const intl = useIntl();

  // State Management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);

  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    partner_id: 0,
    amount_total: 0,
    state: "draft",
    invoice_date: new Date().toISOString().split("T")[0],
  });

  // Odoo JSON-RPC configuration
  const odooConfig = {
    baseURL: process.env.REACT_APP_ODOO_URL || '',
    database: process.env.REACT_APP_ODOO_DB || '',
    username: process.env.REACT_APP_ODOO_USERNAME || '',
    password: process.env.REACT_APP_ODOO_PASSWORD || ''
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchInvoices();
    fetchPartners();

    // Cleanup function to handle unmounting
    return () => {
      setInvoices([]);
      setFilteredInvoices([]);
      setPartners([]);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = invoices.filter(
      (invoice) =>
        invoice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.partner_id[1].toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(odooConfig.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              odooConfig.database,
              parseInt(odooConfig.username),
              odooConfig.password,
              "account.move",
              "search_read",
              [[]],
              {
                fields: [
                  "name",
                  "partner_id",
                  "amount_total",
                  "state",
                  "invoice_date",
                  "invoice_user_id",
                  "company_id",
                ],
                limit: 100,
              },
            ],
          },
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setInvoices(data.result);
        setFilteredInvoices(data.result);
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
      const response = await fetch(odooConfig.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              odooConfig.database,
              2,
              odooConfig.password,
              "res.partner",
              "search_read",
              [[]],
              {
                fields: ["id", "name"],
                limit: 100,
              },
            ],
          },
          id: 2,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setPartners(data.result);
      }
    } catch (err) {
      console.error("Failed to fetch partners", err);
      setError("Failed to fetch partners list");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(odooConfig.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "object",
            method: "execute_kw",
            args: [
              odooConfig.database,
              2,
              odooConfig.password,
              "account.move",
              "create",
              [
                {
                  partner_id: newInvoice.partner_id,
                  amount_total: newInvoice.amount_total,
                  state: newInvoice.state,
                  invoice_date: newInvoice.invoice_date,
                },
              ],
            ],
          },
          id: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 5000);
        fetchInvoices(); // Refresh the list
        // Reset form
        setNewInvoice({
          partner_id: 0,
          amount_total: 0,
          state: "draft",
          invoice_date: new Date().toISOString().split("T")[0],
        });
      }
    } catch (err) {
      setError("Failed to create invoice");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentPageItems = (): Invoice[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredInvoices.slice(startIndex, endIndex);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // If you need to navigate, use history.push('/route')
  const handleNavigate = (route: string) => {
    history.push(route);
  };

  return (
    <Grid fullWidth style={{ padding: "2rem", minHeight: "100vh" }}>
      <Column lg={16} md={8} sm={4}>
        <h1 className="mb-6">Billing Management</h1>

        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            hideCloseButton={false}
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        {showSuccessNotification && (
          <InlineNotification
            kind="success"
            title="Success"
            subtitle="Invoice created successfully"
            hideCloseButton={false}
            onClose={() => setShowSuccessNotification(false)}
            className="mb-4"
          />
        )}

        <div className="mb-6">
          <TextInput
            id="search"
            labelText="Search invoices"
            placeholder="Search by invoice number or client name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            renderIcon={Search}
          />
        </div>

        {loading ? (
          <Loading description="Loading invoices..." withOverlay={false} />
        ) : (
          <>
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
                    <TableCell>{formatCurrency(invoice.amount_total)}</TableCell>
                    <TableCell>
                      <span className={`status-${invoice.state}`}>
                        {invoice.state.charAt(0).toUpperCase() + invoice.state.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              totalItems={filteredInvoices.length}
              pageSize={pageSize}
              page={currentPage}
              onChange={({ page, pageSize: size }) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </>
        )}

        <div className="mt-8">
          <h2 className="mb-4">Create New Invoice</h2>
          <Form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="partner-select"
                labelText="Client"
                value={newInvoice.partner_id.toString()}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    partner_id: Number(e.target.value),
                  })
                }
                invalid={isSubmitting && newInvoice.partner_id === 0}
                invalidText="Please select a client"
              >
                <SelectItem value="0" text="Select a client" />
                {partners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={partner.id.toString()}
                    text={partner.name}
                  />
                ))}
              </Select>

              <NumberInput
                id="amount-input"
                label="Amount"
                value={newInvoice.amount_total}
                onChange={(e: any) =>
                  setNewInvoice({
                    ...newInvoice,
                    amount_total: Number(e.target.value),
                  })
                }
                min={0}
                step={0.01}
              />

              <Select
                id="status-select"
                labelText="Status"
                value={newInvoice.state}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    state: e.target.value,
                  })
                }
              >
                <SelectItem value="draft" text="Draft" />
                <SelectItem value="posted" text="Posted" />
                <SelectItem value="paid" text="Paid" />
              </Select>

              <DatePicker dateFormat="Y-m-d" datePickerType="single">
                <DatePickerInput
                  id="date-input"
                  labelText="Invoice Date"
                  value={newInvoice.invoice_date}
                  onChange={(e) =>
                    setNewInvoice({
                      ...newInvoice,
                      invoice_date: e.target.value,
                    })
                  }
                />
              </DatePicker>
            </div>

            <Button
              type="submit"
              className="mt-4"
              disabled={
                isSubmitting ||
                newInvoice.partner_id === 0 ||
                newInvoice.amount_total <= 0
              }
            >
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </Form>
        </div>
      </Column>
    </Grid>
  );
};

export default withRouter(BillingPage);