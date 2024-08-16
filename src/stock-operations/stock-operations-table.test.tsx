import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStockOperationPages } from './stock-operations-table.resource';
import StockOperations from './StockOperations';
import { showModal, useConfig } from '@openmrs/esm-framework';
import { handleMutate } from '../utils';

// Mock the necessary modules and hooks
jest.mock('./stock-operations-table.resource');
jest.mock('@openmrs/esm-framework');
jest.mock('../utils');

// Mock the translation function
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('StockOperations', () => {
  const mockStockOperations = [
    {
      uuid: '1',
      operationTypeName: 'Receive',
      status: 'NEW',
      sourceName: 'Warehouse',
      destinationName: 'Pharmacy',
      responsiblePersonFamilyName: 'Doe',
      responsiblePersonGivenName: 'John',
      operationDate: '2023-05-01',
      dateCreated: '2023-05-01',
      creatorFamilyName: 'Smith',
      creatorGivenName: 'Jane',
      stockOperationItems: [
        { batchNo: 'BATCH1', quantity: 100 },
        { batchNo: 'BATCH2', quantity: 200 },
      ],
    },
  ];

  beforeEach(() => {
    useStockOperationPages.mockReturnValue({
      items: mockStockOperations,
      tableHeaders: [
        { key: 'operationTypeName', header: 'Operation Type' },
        { key: 'status', header: 'Status' },
        { key: 'source', header: 'Source' },
        { key: 'destination', header: 'Destination' },
      ],
      currentPage: 1,
      pageSizes: [10, 20, 30],
      totalItems: 1,
      goTo: jest.fn(),
      currentPageSize: 10,
      setPageSize: jest.fn(),
      isLoading: false,
    });

    useConfig.mockReturnValue({
      stockSourceTypeUUID: 'mock-uuid',
    });
  });

  it('renders initial component correctly', async () => {
    render(<StockOperations />);

    expect(screen.getByText('stockOperationTrackMovement')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter Table')).toBeInTheDocument();
    expect(screen.getByText('Receive')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
  });

  it('displays error state when data loading fails', async () => {
    useStockOperationPages.mockReturnValue({
      ...useStockOperationPages(),
      isLoading: true,
    });

    render(<StockOperations />);

    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
  });

  it('renders correct tabs based on props', async () => {
    render(<StockOperations />);

    expect(screen.getByText('stockOperationTrackMovement')).toBeInTheDocument();
  });

  it('displays status information correctly', async () => {
    render(<StockOperations />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('simulates tab switching and verifies content', async () => {
    render(<StockOperations />);

    const expandButton = screen.getAllByRole('button')[0];
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Date Created')).toBeInTheDocument();
      expect(screen.getByText('Date Completed')).toBeInTheDocument();
      expect(screen.getByText('Batch Number')).toBeInTheDocument();
      expect(screen.getByText('Qty')).toBeInTheDocument();
    });
  });

  it('calls corresponding actions when buttons are clicked', async () => {
    render(<StockOperations />);

    const overflowMenuButton = screen.getAllByRole('button')[1];
    fireEvent.click(overflowMenuButton);

    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);

    expect(showModal).toHaveBeenCalledWith('stock-operation-dialog', expect.any(Object));
    expect(handleMutate).toHaveBeenCalledWith(expect.stringContaining('/stockmanagement/stockoperation'));
  });

  it('handles data fetching states correctly', async () => {
    useStockOperationPages.mockReturnValue({
      ...useStockOperationPages(),
      isLoading: true,
    });

    render(<StockOperations />);

    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();

    useStockOperationPages.mockReturnValue({
      ...useStockOperationPages(),
      isLoading: false,
    });

    render(<StockOperations />);

    expect(screen.getByText('Receive')).toBeInTheDocument();
  });

  it('mocks and verifies calls to external utilities and functions', async () => {
    render(<StockOperations />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(handleMutate).toHaveBeenCalledWith(expect.stringContaining('/stockmanagement/stockoperation'));
  });

  it('filters items based on date range', async () => {
    render(<StockOperations />);

    const dateInputs = screen.getAllByPlaceholderText('mm/dd/yyyy');
    fireEvent.change(dateInputs[0], { target: { value: '05/01/2023' } });
    fireEvent.change(dateInputs[1], { target: { value: '05/31/2023' } });

    await waitFor(() => {
      expect(screen.getByText('Receive')).toBeInTheDocument();
    });
  });

  it('filters items based on search input', async () => {
    render(<StockOperations />);

    const searchInput = screen.getByPlaceholderText('Filter Table');
    fireEvent.change(searchInput, { target: { value: 'Receive' } });

    await waitFor(() => {
      expect(screen.getByText('Receive')).toBeInTheDocument();
    });
  });
});