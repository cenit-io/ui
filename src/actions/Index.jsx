import React, { useEffect, useRef, useState } from 'react';
import Loading from '../components/Loading';
import { Checkbox, alpha, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Box from "@mui/material/Box";
import ListIcon from '@mui/icons-material/List';
import ActionRegistry, { ActionKind } from "./ActionRegistry";
import { map, switchMap } from "rxjs/operators";
import zzip from "../util/zzip";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useSpreadState } from "../common/hooks";
import { useContainerContext } from "./ContainerContext";
import { originBackgroundSx, originTextSx } from "../components/OriginsColors";
import viewerComponentFor from "../viewers/viewerComponentFor";
import { useTenantContext } from "../layout/TenantContext";
import ActionPicker from "./ActionPicker";
import pluralize from "pluralize";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    fontWeight: 700,
    backgroundColor: theme.palette.background.paper
  },
  '&.MuiTableCell-body': {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  height: '100%',
  '& th:first-child': {
    padding: 0
  },
  '& td:first-child': {
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    padding: 0,
    '& div': {
      height: '100%',
      display: 'flex',
      alignItems: 'center'
    }
  },
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.02),
    '& td:first-child': {
      '& .check': {
        backgroundColor: alpha(theme.palette.action.hover, 0.02),
      }
    }
  },
  '&:hover': {
    '& td:first-child': {
      '& .check': {
        background: `${theme.palette.action.hover} !important`
      }
    }
  }
}));


const EnhancedTableHead = ({ props, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) => {

  const createSortHandler = property => event => {
    onRequestSort(event, property);
  };

  return (
    <TableHead component="thead">
      <StyledTableRow>
        <StyledTableCell padding="checkbox"
                         style={{
                           backgroundColor: "#fff",
                           position: "sticky",
                           top: 0,
                           left: 0,
                           zIndex: 3
                         }}>
          <Checkbox indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={numSelected === rowCount}
                    onChange={onSelectAllClick}
                    inputProps={{ 'aria-label': 'Select all' }}
          />
        </StyledTableCell>
        {
          props.map(prop => (
            <StyledTableCell key={prop.prop.name}
                             align={prop.numeric ? 'right' : 'left'}
                             padding={prop.disablePadding ? 'none' : 'default'}
                             sortDirection={orderBy === prop.prop.name ? order : false}
                             style={{
                               position: "sticky",
                               top: 0,
                               zIndex: 1
                             }}>
              <TableSortLabel active={orderBy === prop.prop.name}
                              direction={order}
                              onClick={createSortHandler(prop.prop.name)}>
                {prop.title}
              </TableSortLabel>
            </StyledTableCell>
          ))
        }
      </StyledTableRow>
    </TableHead>
  );
};

const pageShadowSx = (theme) => ({
  boxShadow: "0 2px 5px 1px rgb(64 60 67 / 16%)",
  borderRadius: "6px",
  backgroundColor: theme.palette.background.paper,
});

const MinItemsPerPage = 5;

const ItemsPerPage = [MinItemsPerPage, 10, 25];

function ListView({ height, dataType, config, onSubjectPicked }) {

  const [state, setState] = useSpreadState({
    order: 'asc',
    orderBy: '_id',
  });

  const highlightTimer = useRef(0);

  const [containerState, setContainerState] = useContainerContext();

  const { data, selectedItems, props, withOrigin, handleAction } = containerState;

  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.down('sm'));

  const tableContainerRef = useRef(null);

  const { dense, highlightTop, highlightIndex } = state;

  const select = selectedItems => setContainerState({ selectedItems });

  const handleSelectAllClick = event => {
    let selection;
    if (event.target.checked) {
      selection = [...data.items];
    } else {
      selection = [];
    }
    select(selection);
  };

  const handleSelectOne = item => () => {
    if (selectedItems.length === 1 && selectedItems[0].id === item.id) {
      select([]);
    } else {
      select([item]);
    }
  };

  const handleSelect = item => () => {
    const index = selectedItems.findIndex(i => i.id === item.id);
    const newSelection = [...selectedItems];

    if (index === -1) {
      newSelection.push(item);
    } else {
      newSelection.splice(index, 1);
    }

    select(newSelection);
  };

  const rows = data.items.map((item, index) => {
    let isSelected = selectedItems.findIndex(i => i.id === item.id) !== -1;
    return (
      <StyledTableRow hover
                      key={item.id}
                      onClick={handleSelectOne(item)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={-1}
                      onMouseEnter={e => {
                        clearHighlightTimer();
                        setState({
                          highlightIndex: index,
                          highlightTop: e.target.getBoundingClientRect().top -
                            tableContainerRef.current.getBoundingClientRect().top
                        });
                      }}>
        <StyledTableCell padding="checkbox"
                         style={{
                           color: '#fff',
                           position: "sticky",
                           left: 0,
                           zIndex: 2
                         }}>
          <div className="check"
               style={withOrigin ? originBackgroundSx(item.origin) : undefined}>
            <Checkbox sx={withOrigin ? originTextSx(theme, item.origin) : undefined}
                      checked={isSelected}
                      inputProps={{ 'aria-labelledby': item.id }}
                      onChange={handleSelect(item)} />
          </div>
        </StyledTableCell>
        {
          props.map(({ prop }) => {
            const Viewer = viewerComponentFor(prop, config);
            return (
              <StyledTableCell key={`${item.id}.${prop.name}`}>
                <Viewer prop={prop}
                        value={item[prop.jsonKey]}
                        item={item} />
              </StyledTableCell>
            );
          })
        }
      </StyledTableRow>
    );
  });

  const hideHighlight = timeout => highlightTimer.current = setTimeout(
    () => setState({ highlightTop: false }),
    typeof timeout === 'number' ? timeout : 3000
  );

  const clearHighlightTimer = () => clearTimeout(highlightTimer.current);

  return (
    <Box ref={tableContainerRef}
         style={{ minHeight: `calc(${height} - 400px)` }}
         sx={{
           position: 'relative',
           backgroundColor: theme.palette.background.default,
           boxSizing: "border-box",
           padding: theme.spacing(1, .5),
           overflow: "hidden",
           [theme.breakpoints.up('sm')]: {
             padding: theme.spacing(3),
           },
         }}>
      <Box sx={{
        ...pageShadowSx(theme),
        maxHeight: `calc(${height} - ${xs ? '0px' : '2rem'})`,
        overflow: "auto",
        boxSizing: "border-box",
      }}
           onMouseLeave={hideHighlight}>
        <Table sx={{ height: 1 }} size={dense ? "small" : "medium"}>
          <EnhancedTableHead
            props={props}
            onSelectAllClick={handleSelectAllClick}
            numSelected={selectedItems.length}
            rowCount={data.items.length}
          />
          <TableBody>{rows}</TableBody>
        </Table>
      </Box>
      {!selectedItems.length && highlightTop && (
        <Box sx={{
          top: highlightTop,
          position: 'absolute',
          right: theme.spacing(.5),
          width: theme.spacing(31),
          background: theme.palette.background.default,
          borderRadius: theme.spacing(1.5),
          [theme.breakpoints.up('sm')]: {
            right: theme.spacing(3),
          },
        }}
             onMouseEnter={clearHighlightTimer}
             onMouseLeave={hideHighlight}>
          <ActionPicker kind={ActionKind.member}
                        arity={1}
                        onAction={actionKey => handleAction(
                          dataType, actionKey, onSubjectPicked, [data.items[highlightIndex]])
                        }
                        dataType={dataType}
                        record={data.items[highlightIndex]} />

        </Box>
      )}
    </Box>
  );
}

function DefaultIndex({ dataType, height, width, dataTypeConfig, onSubjectPicked }) {

  const [tenantState] = useTenantContext();
  const { user } = tenantState;
  const [containerState, setContainerState] = useContainerContext();

  const { data, page, limit, props, itemsViewport, selector, containerTitle } = containerState;

  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setContainerState({ loading: true });
    const subscription = dataType.config().pipe(
      switchMap(
        config => {
          let configFields = config.actions?.index?.fields;
          if (configFields) {
            if (typeof configFields === 'function') {
              configFields = configFields(user)
            }
            return dataType.properties().pipe(
              map(
                properties => configFields.map(
                  field => properties[field]
                ).filter(f => f)
              )
            );
          }

          return dataType.allProperties();
        }
      ),
      switchMap(
        props => zzip(...props.map(prop => prop.getTitle())).pipe(
          map(
            titles => titles.map(
              (title, index) => ({ title, prop: props[index] })
            )
          )
        )
      )
    ).subscribe(props => setContainerState({ props }));

    return () => subscription.unsubscribe();
  }, [dataType, user]);

  useEffect(() => {
    if (props) {
      const subscription = zzip(
        dataType.config(),
        dataType.withOrigin(),
        ...props.map(({ prop }) => prop.viewportToken())
      ).subscribe(
        ([config, withOrigin, ...tokens]) => {
          let itemsViewport = config.actions?.index?.viewport;
          if (!itemsViewport) {
            if (withOrigin) {
              tokens.push('origin');
            }
            itemsViewport = `{_id ${tokens.join(' ')}}`;
          }

          setContainerState({ withOrigin, itemsViewport });
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [dataType, props]);

  useEffect(() => {
    if (itemsViewport) {
      setContainerState({ loading: true });
      const subscription = dataType.find({
        limit: limit,
        page: page,
        sort: { _id: -1 },
        props: dataType.queryProps(),
        viewport: itemsViewport,
        selector
      }).subscribe(data => setContainerState(({ selectedItems }) => {
        const itemsHash = data.items.reduce((hash, item) => (hash[item.id] = item) && hash, {});
        selectedItems = selectedItems.map(({ id }) => itemsHash[id]).filter(item => item);
        return { data, loading: false, selectedItems };
      }));

      return () => subscription.unsubscribe();
    }
  }, [selector, limit, page, dataType, itemsViewport]);

  const select = selectedItems => setContainerState({ selectedItems });

  const handleChangePage = (_, page) => {
    setContainerState({ data: null, page });
    select([]);
  };

  const handleChangeRowsPerPage = event => {
    setContainerState({
      data: null,
      limit: +event.target.value,
      page: 0
    });
    select([]);
  };

  if (!props || !data || !itemsViewport) {
    return <div />;
  }

  let viewHeight = height;

  let pagination;

  if (data.count > MinItemsPerPage) {
    viewHeight = `${viewHeight} - ${theme.spacing(10)}`;
    const pagOpts = {};
    if (xs) {
      pagOpts.siblingCount = 0;
    }
    const pageSizeLabel = xs
      ? 'Page size'
      : `${pluralize(containerTitle)} per page`;
    pagination = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: theme.spacing(7),
          boxSizing: "border-box",
          mx: xs ? 0 : 3,
          p: 0,
          justifyContent: xs ? "space-evenly" : "flex-start",
          ...(xs ? {} : pageShadowSx(theme)),
        }}>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="subtitle2" component="div">
          {pageSizeLabel}
        </Typography>
        <Select
                value={limit}
                onChange={handleChangeRowsPerPage}
                variant="outlined"
                sx={{
                  mx: 1,
                  height: "50%",
                  fontSize: 14,
                  minWidth: 64,
                }}>
          {
            ItemsPerPage.map((c, index) => (
              <MenuItem key={`ipp_${index}_${c}`}
                        value={c}>
                {c}
              </MenuItem>
            ))
          }
        </Select>
        <Pagination count={data.total_pages}
                    page={data.current_page}
                    {...pagOpts}
                    onChange={handleChangePage}
                    size="small"
                    color="primary" />
      </Box>
    );
  }

  const View = dataTypeConfig.actions?.index?.viewComponent || ListView;

  return (
    <>
      <View height={viewHeight}
            width={width}
            dataType={dataType}
            config={dataTypeConfig}
            onSubjectPicked={onSubjectPicked} />
      {pagination}
    </>
  );
}

function Index(props) {
  const [config, setConfig] = useState(null);
  const { dataType } = props;

  useEffect(() => {
    const subscription = dataType.config().subscribe(
      config => setConfig(config)
    );
    return () => subscription.unsubscribe();
  }, [dataType]);

  if (config) {
    const IndexComponent = config.actions?.index?.component || DefaultIndex;

    return <IndexComponent dataTypeConfig={config} {...props} />;
  }

  return <Loading />;
}

export default ActionRegistry.register(Index, {
  kind: ActionKind.collection,
  bulkable: true,
  icon: ListIcon,
  title: 'List',
  key: 'index'
});
