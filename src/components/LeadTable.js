import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';

const LeadTable = ({ leads, onDelete, onBlacklist, onStatusChange, source }) => {
  const handleStatusChange = (index, newStatus) => {
    if (onStatusChange) {
      onStatusChange(index, newStatus);
    }
  };

  const renderNameCell = (lead) => (
    <>
      {lead.thumbnail && (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-block',
          marginRight: '10px',
          border: '2px solid #eee',
          verticalAlign: 'middle'
        }}>
          <img 
            src={lead.thumbnail} 
            alt={lead.name || lead.companyName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/40';
            }}
          />
        </div>
      )}
      <span style={{ verticalAlign: 'middle' }}>
        {lead.companyName || lead.name || '-'}
      </span>
    </>
  );

  const renderActions = (lead) => (
    <div style={{ whiteSpace: 'nowrap' }}>
      <Tooltip title="Löschen">
        <IconButton 
          onClick={() => onDelete?.(lead)}
          size="small"
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Blockieren">
        <IconButton 
          onClick={() => onBlacklist?.(lead)}
          size="small"
          color="warning"
        >
          <BlockIcon />
        </IconButton>
      </Tooltip>
    </div>
  );

  const renderStatus = (status, index) => (
    <Select
      value={status || 'not-scheduled'}
      onChange={(e) => handleStatusChange(index, e.target.value)}
      size="small"
      fullWidth
    >
      <MenuItem value="scheduled">Geplant</MenuItem>
      <MenuItem value="later">Später</MenuItem>
      <MenuItem value="not-scheduled">Nicht geplant</MenuItem>
    </Select>
  );

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (lead) => renderNameCell(lead)
    },
    {
      title: 'Website',
      key: 'website',
      render: (lead) => lead.website ? (
        <a href={lead.website} target="_blank" rel="noopener noreferrer">
          {lead.website}
        </a>
      ) : '-'
    }
  ];

  if (source === 'instagram') {
    columns.splice(1, 0, {
      title: 'Profilname',
      key: 'profile',
      render: (lead) => lead.name || '-'
    });
    columns.splice(2, 0, {
      title: 'Beschreibung',
      key: 'description',
      render: (lead) => {
        const desc = lead.description || lead.biography || '';
        return desc ? desc.substring(0, 100) + (desc.length > 100 ? '...' : '') : '-';
      }
    });
    columns.splice(3, 0, {
      title: 'Instagram',
      key: 'instagram',
      render: (lead) => lead.profileUrl ? (
        <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer">
          Zum Profil
        </a>
      ) : '-'
    });
  } else {
    columns.splice(1, 0, {
      title: 'Adresse',
      key: 'address',
      render: (lead) => lead.address || '-'
    });
    columns.splice(2, 0, {
      title: 'Telefon',
      key: 'phone',
      render: (lead) => lead.phone || '-'
    });
    columns.splice(3, 0, {
      title: 'E-Mail',
      key: 'email',
      render: (lead) => lead.email ? (
        <a href={`mailto:${lead.email}`}>{lead.email}</a>
      ) : '-'
    });
  }

  // Add status and actions columns for both sources
  columns.push(
    {
      title: 'Status',
      key: 'status',
      render: (lead, index) => renderStatus(lead.status, index)
    },
    {
      title: 'Aktionen',
      key: 'actions',
      render: (lead) => renderActions(lead)
    }
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead, index) => (
            <TableRow 
              key={`${lead.companyName}-${index}`}
            >
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render(lead, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeadTable;
