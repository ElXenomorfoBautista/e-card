SET search_path TO e_card,public;

CREATE  TABLE e_card.products (
	id                   integer  NOT NULL GENERATED BY DEFAULT AS IDENTITY ,
	name                 varchar(100)    ,
	description          text    ,
	price                numeric    ,
	created_on           timestamptz    ,
	modified_on          timestamptz    ,
	deleted              boolean    ,
	deleted_on           timestamptz    ,
	deleted_by           numeric    ,
	CONSTRAINT pk_products PRIMARY KEY ( id )
 );

