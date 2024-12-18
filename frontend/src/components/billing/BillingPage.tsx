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
  Tag,
  Tile,
} from "@carbon/react";
import { useIntl } from "react-intl";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { 
  Search, 
  Currency, 
  UserAvatar, 
  Calendar,
  Enterprise,
  Reset 
} from "@carbon/icons-react";

// TypeScript interfaces
interface Invoice {
  id: number;
  name: string | false;
  partner_id: [number, string] | false;
  amount_total: number;
  state: string;
  invoice_date: string;
  invoice_user_id: [number, string];
  company_id: [number, string];
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

const odooConfig = {
  baseURL: 'https://united-nations-development-programme.odoo.com/jsonrpc',
  database: 'united-nations-development-programme',
  userId: 2,
  password: 'Silnam@123'
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'gray';
    case 'posted':
      return 'green';
    case 'paid':
      return 'blue';
    default:
      return 'cool-gray';
  }
};

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

  const pageSizes = [10, 20, 30, 40, 50];

  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    partner_id: 0,
    amount_total: 0,
    state: "draft",
    invoice_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (mounted) {
        await fetchInvoices();
        await fetchPartners();
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) => {
      const nameMatch = invoice.name && 
        invoice.name.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const partnerMatch = invoice.partner_id && 
        invoice.partner_id[1].toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || partnerMatch;
    });
    setFilteredInvoices(filtered);
    setCurrentPage(1);
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
              odooConfig.userId,
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
                  "company_id"
                ],
                limit: 100
              }
            ]
          },
          id: 1
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.data?.message || 'Failed to fetch invoices');
      }

      if (data.result) {
        setInvoices(data.result);
        setFilteredInvoices(data.result);
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
      setError(err.message || "Failed to fetch invoices");
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
              odooConfig.userId,
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
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.data?.message || 'Failed to fetch partners');
      }

      if (data.result) {
        setPartners(data.result);
      }
    } catch (err) {
      console.error('Fetch partners error:', err);
      setError(err.message || "Failed to fetch partners list");
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
              odooConfig.userId,
              odooConfig.password,
              "account.move",
              "create",
              [{
                move_type: 'out_invoice',
                partner_id: newInvoice.partner_id,
                amount_total: newInvoice.amount_total,
                state: newInvoice.state,
                invoice_date: newInvoice.invoice_date,
                company_id: 1
              }]
            ]
          },
          id: 3
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.data?.message || 'Failed to create invoice');
      }

      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 5000);
      fetchInvoices();
      setNewInvoice({
        partner_id: 0,
        amount_total: 0,
        state: "draft",
        invoice_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error('Create invoice error:', err);
      setError(err.message || "Failed to create invoice");
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

  return (
    <Grid fullWidth className="bg-white">
      <Column lg={16} md={8} sm={4}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-light">Billing Management</h1>
            <Button
              kind="ghost"
              renderIcon={Reset}
              onClick={fetchInvoices}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              hideCloseButton={false}
              onClose={() => setError(null)}
              className="mb-6"
              lowContrast
            />
          )}

          {showSuccessNotification && (
            <InlineNotification
              kind="success"
              title="Success"
              subtitle="Invoice created successfully"
              hideCloseButton={false}
              onClose={() => setShowSuccessNotification(false)}
              className="mb-6"
              lowContrast
            />
          )}

          <Tile className="mb-8 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <TextInput
                  id="search"
                  labelText="Search invoices"
                  placeholder="Search by invoice number or client name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-96"
                />
              </div>
              <div className="text-sm text-gray-600">
                {filteredInvoices.length} invoices found
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loading 
                  description="Loading invoices..." 
                  withOverlay={false}
                  small
                />
              </div>
            ) : (
              <>
                <Table useZebraStyles>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Invoice Number</TableHeader>
                      <TableHeader>Client</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Created By</TableHeader>
                      <TableHeader>Company</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentPageItems().map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <UserAvatar size={16} className="mr-2" />
                            {invoice.partner_id ? invoice.partner_id[1] : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Currency size={16} className="mr-2" />
                            {formatCurrency(invoice.amount_total)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tag
                            type={getStatusColor(invoice.state)}
                            size="sm"
                          >
                            {invoice.state.charAt(0).toUpperCase() + invoice.state.slice(1)}
                          </Tag>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.invoice_user_id[1]}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Enterprise size={16} className="mr-2" />
                            {invoice.company_id[1]}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4">
                  <Pagination
                    totalItems={filteredInvoices.length}
                    pageSize={pageSize}
                    pageSizes={pageSizes}
                    page={currentPage}
                    onChange={({ page, pageSize: size }) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                  />
                </div>
              </>
            )}
          </Tile>

          <Tile className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-light">Create New Invoice</h2>
            </div>
            <Form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-6">
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
                  value={newInvoice.amount_total || 0}
                  step={0.01}
                  min={0}
                  invalidText="Please enter a valid amount"
                  onChange={(e: any) => {
                    const value = parseFloat(e.target.value) || 0;
                    setNewInvoice({
                      ...newInvoice,
                      amount_total: value
                    });
                  }}
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

              <TextInput
                id="date-input"
                labelText="Invoice Date"
                type="date"
                value={newInvoice.invoice_date}
                onChange={(e) =>
                  setNewInvoice({
                    ...newInvoice,
                    invoice_date: e.target.value,
                  })
                }
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  newInvoice.partner_id === 0 ||
                  newInvoice.amount_total <= 0
                }
              >
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </Form>
        </Tile>
      </div>
    </Column>
  </Grid>
  );
};

export default withRouter(BillingPage);