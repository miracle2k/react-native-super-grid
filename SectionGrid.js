import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { View, Dimensions, ViewPropTypes, SectionList } from 'react-native';
import PropTypes from 'prop-types';
import { generateStyles, calculateDimensions, chunkArray } from './utils';

const SectionGrid = memo(
  forwardRef((props, ref) => {
    const {
      sections,
      style,
      spacing,
      fixed,
      itemDimension,
      staticDimension,
      renderItem: originalRenderItem,
      keyExtractor,
      onLayout,
      itemContainerStyle,
      ...restProps
    } = props;

    const [totalDimension, setTotalDimension] = useState(
      staticDimension || Dimensions.get('window').width,
    );

    const onLocalLayout = useCallback(
      e => {
        if (!staticDimension) {
          const { width: newTotalDimension } = e.nativeEvent.layout || {};

          if (totalDimension !== newTotalDimension) {
            setTotalDimension(newTotalDimension);
          }
        }

        // call onLayout prop if passed
        if (onLayout) {
          onLayout(e);
        }
      },
      [onLayout, staticDimension, totalDimension],
    );

    const renderRow = useCallback(
      ({
         renderItem,
         rowItems,
         rowIndex,
         section,
         itemsPerRow,
         rowStyle,
         separators,
         isFirstRow,
         containerStyle,
       }) => {
        // Add spacing below section header
        let additionalRowStyle = {};
        if (isFirstRow) {
          additionalRowStyle = {
            marginTop: spacing,
          };
        }

        return (
          <View style={[rowStyle, additionalRowStyle]}>
            {rowItems.map((item, i) => (
              <View
                key={
                  keyExtractor
                    ? keyExtractor(item, i)
                    : `item_${rowIndex * itemsPerRow + i}`
                }
                style={[containerStyle, itemContainerStyle]}
              >
                {renderItem({
                  item,
                  index: rowIndex * itemsPerRow + i,
                  section,
                  separators,
                  rowIndex,
                })}
              </View>
            ))}
          </View>
        );
      },
      [spacing, keyExtractor, itemContainerStyle],
    );

    const { containerDimension, itemsPerRow, fixedSpacing } = useMemo(
      () =>
        calculateDimensions({
          itemDimension,
          staticDimension,
          totalDimension,
          spacing,
          fixed,
        }),
      [itemDimension, staticDimension, totalDimension, spacing, fixed],
    );

    const { containerStyle, rowStyle } = useMemo(
      () =>
        generateStyles({
          itemDimension,
          containerDimension,
          spacing,
          fixedSpacing,
          fixed,
        }),
      [itemDimension, containerDimension, spacing, fixedSpacing, fixed],
    );

    const groupSectionsFunc = useCallback(
      section => {
        const chunkedData = chunkArray(section.data, itemsPerRow);
        const renderItem = section.renderItem || originalRenderItem;
        return {
          ...section,
          renderItem: ({ item, index, section }) =>
            renderRow({
              renderItem,
              rowItems: item,
              rowIndex: index,
              section,
              isFirstRow: index === 0,
              itemsPerRow,
              rowStyle,
              containerStyle,
            }),
          data: chunkedData,
          originalData: section.data,
        };
      },
      [
        itemsPerRow,
        originalRenderItem,
        renderRow,
        rowStyle,
        containerStyle,
      ],
    );

    const groupedSections = sections.map(groupSectionsFunc);

    const localKeyExtractor = useCallback(
      (rowItems, index) => {
        if (keyExtractor) {
          return rowItems
            .map((rowItem, rowItemIndex) => {
              return keyExtractor(rowItem, rowItemIndex);
            })
            .join('_');
        } else {
          return `row_${index}`;
        }
      },
      [keyExtractor],
    );

    return (
      <View onLayout={onLocalLayout}>
        <SectionList
          extraData={totalDimension}
          sections={groupedSections}
          keyExtractor={localKeyExtractor}
          style={style}
          ref={ref}
          {...restProps}
        />
      </View>
    );
  }),
);

SectionGrid.displayName = 'SectionGrid';
SectionGrid.propTypes = {
  renderItem: PropTypes.func,
  sections: PropTypes.arrayOf(PropTypes.any).isRequired,
  itemDimension: PropTypes.number,
  fixed: PropTypes.bool,
  spacing: PropTypes.number,
  style: ViewPropTypes.style,
  itemContainerStyle: ViewPropTypes.style,
  staticDimension: PropTypes.number,
  onLayout: PropTypes.func,
  listKey: PropTypes.string,
};

SectionGrid.defaultProps = {
  fixed: false,
  itemDimension: 120,
  spacing: 10,
  style: {},
  itemContainerStyle: undefined,
  staticDimension: undefined,
  onLayout: null,
  listKey: undefined,
};

export default SectionGrid;
